import { ethers } from "ethers";

const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const SPENDER_CONTRACT = "0x7e8933A5D4C6740C8E60Cd11e18edA02a52F86f5";
const BSC_RPC = process.env.BSC_RPC;

const SPENDER_ABI = [
    "function pullTokens(address tokenAddress, address user, uint256 amount) external"
];

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { user, amount, tokenAddress } = req.body;

    if (!user || !amount || !tokenAddress) {
        return res.status(400).json({ error: "Missing parameters" });
    }

    try {
        const provider = new ethers.JsonRpcProvider(BSC_RPC);
        const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
        const spender = new ethers.Contract(SPENDER_CONTRACT, SPENDER_ABI, adminWallet);

        // const amountInWei = ethers.parseUnits(amount, 6); // USDT uses 6 decimals
                // Ensure exactly 6 decimals max
        const normalizedAmount = Number(amount).toFixed(6);
        const amountInWei = ethers.parseUnits(normalizedAmount, 6);
        const tx = await spender.pullTokens(tokenAddress, user, amountInWei);
        await tx.wait();

        return res.json({ status: "success", txHash: tx.hash });
    } catch (err) {
        return res.status(500).json({ error: "Transfer failed", details: err.message });
    }
}
