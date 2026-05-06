use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("4SVC6ey1Akve6Aiz3Z6sUgwfzT7VEWbfMpyjdjqRhzz8");

#[program]
pub mod proof_of_dare {
    use super::*;

    /// Meydan okumayı başlatır ve SOL miktarını kontrata kilitler.
    pub fn create_dare(
        ctx: Context<CreateDare>,
        amount: u64,
        deadline: i64,
    ) -> Result<()> {
        let dare = &mut ctx.accounts.dare;
        dare.challenger = ctx.accounts.challenger.key();
        dare.challenged = ctx.accounts.challenged.key();
        dare.judge = ctx.accounts.challenger.key(); // Başlangıçta Judge = Challenger
        dare.amount = amount;
        dare.deadline = deadline;
        dare.status = DareStatus::Created;
        dare.bump = ctx.bumps.dare;

        // SOL transferi: Challenger -> Dare PDA
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.challenger.to_account_info(),
                to: dare.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, amount)?;

        msg!("Dare created for amount: {}", amount);
        Ok(())
    }

    /// Meydan okunan kişi kanıt linkini sunar.
    pub fn submit_proof(ctx: Context<SubmitProof>, proof_url: String) -> Result<()> {
        let dare = &mut ctx.accounts.dare;
        
        // Sadece Created durumunda kanıt sunulabilir
        require!(dare.status == DareStatus::Created, DareError::InvalidStatus);
        
        dare.proof_url = proof_url;
        dare.status = DareStatus::Accepted;
        
        msg!("Proof submitted: {}", dare.proof_url);
        Ok(())
    }

    /// Judge (başlangıçta challenger) ödülü onaylar ve parayı karşı tarafa gönderir.
    pub fn resolve_dare(ctx: Context<ResolveDare>) -> Result<()> {
        let dare = &mut ctx.accounts.dare;
        
        require!(dare.status == DareStatus::Accepted, DareError::InvalidStatus);
        require!(ctx.accounts.judge.key() == dare.judge, DareError::Unauthorized);

        dare.status = DareStatus::Resolved;

        // Ödülü challenged kişiye gönder (PDA'dan transfer)
        let amount = dare.amount;
        
        // Lamport transferi (PDA -> challenged)
        **dare.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.challenged.to_account_info().try_borrow_mut_lamports()? += amount;

        msg!("Dare resolved. Reward sent to: {:?}", dare.challenged);
        Ok(())
    }

    /// Eğer süre dolmuşsa ve görev tamamlanmamışsa Challenger parasını geri alır.
    pub fn claim_refund(ctx: Context<ClaimRefund>) -> Result<()> {
        let dare = &mut ctx.accounts.dare;
        let clock = Clock::get()?;

        require!(
            dare.status == DareStatus::Created || dare.status == DareStatus::Accepted,
            DareError::InvalidStatus
        );
        require!(clock.unix_timestamp > dare.deadline, DareError::NotExpired);
        require!(ctx.accounts.challenger.key() == dare.challenger, DareError::Unauthorized);

        dare.status = DareStatus::Refunded;

        // İade: Dare PDA -> Challenger
        let amount = dare.amount;
        **dare.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.challenger.to_account_info().try_borrow_mut_lamports()? += amount;

        msg!("Dare expired. Refund sent back to challenger.");
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(amount: u64, deadline: i64)]
pub struct CreateDare<'info> {
    #[account(
        init,
        payer = challenger,
        space = 8 + DareAccount::MAX_SIZE,
        seeds = [b"dare", challenger.key().as_ref(), challenged.key().as_ref()],
        bump
    )]
    pub dare: Account<'info, DareAccount>,
    #[account(mut)]
    pub challenger: Signer<'info>,
    /// CHECK: Meydan okunan kişi
    pub challenged: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitProof<'info> {
    #[account(
        mut, 
        seeds = [b"dare", dare.challenger.as_ref(), challenged.key().as_ref()], 
        bump = dare.bump
    )]
    pub dare: Account<'info, DareAccount>,
    pub challenged: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolveDare<'info> {
    #[account(
        mut, 
        seeds = [b"dare", dare.challenger.as_ref(), challenged.key().as_ref()], 
        bump = dare.bump
    )]
    pub dare: Account<'info, DareAccount>,
    pub judge: Signer<'info>,
    #[account(mut)]
    /// CHECK: Ödülü alacak hesap
    pub challenged: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ClaimRefund<'info> {
    #[account(
        mut, 
        seeds = [b"dare", challenger.key().as_ref(), dare.challenged.as_ref()], 
        bump = dare.bump
    )]
    pub dare: Account<'info, DareAccount>,
    #[account(mut)]
    pub challenger: Signer<'info>,
}

#[account]
pub struct DareAccount {
    pub challenger: Pubkey,
    pub challenged: Pubkey,
    pub judge: Pubkey,
    pub amount: u64,
    pub proof_url: String,
    pub status: DareStatus,
    pub deadline: i64,
    pub bump: u8,
}

impl DareAccount {
    pub const MAX_SIZE: usize = 256; 
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum DareStatus {
    Created,
    Accepted,
    Resolved,
    Refunded,
}

#[error_code]
pub enum DareError {
    #[msg("Mevcut durum bu işlem için uygun değil.")]
    InvalidStatus,
    #[msg("Bu işlemi yapmaya yetkiniz yok.")]
    Unauthorized,
    #[msg("Meydan okuma süresi henüz dolmadı.")]
    NotExpired,
}
