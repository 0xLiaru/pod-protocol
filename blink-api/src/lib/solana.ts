import { Connection } from "@solana/web3.js";

// Artık doğrudan dışarıya değil, kendi oluşturduğumuz güvenli köprüye (proxy) bağlanıyoruz.
// Bu sayede tarayıcı engellerinden (CORS, Failed to Fetch) kurtuluyoruz.
export const RPC_ENDPOINT = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/rpc` 
    : "https://solana-mainnet.chainstacklabs.com"; 

export const CONNECTION = new Connection(RPC_ENDPOINT, {
    commitment: "confirmed",
    fetchMiddleware: (url, options, fetch) => {
        // Tarayıcı tarafında bağlantıyı her zaman bizim /api/rpc üzerinden geçir
        return fetch(url, options);
    }
});
