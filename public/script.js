// Generate random wallet health (90-98%)
const healthScore = Math.floor(Math.random() * 9) + 90;
document.getElementById('healthScore').textContent = `${healthScore}%`;
document.getElementById('healthBar').style.width = `${healthScore}%`;

// Truncate wallet address
const walletAddress = '0x71C7656EC7ab88b098defB751B7401B5f6d8973e4a';
const truncatedAddress = `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`;
document.getElementById('walletAddress').textContent = truncatedAddress;

// Save to Image Button
document.getElementById('saveBtn').addEventListener('click', () => {
    const cardElement = document.getElementById('cardToSave');

    html2canvas(cardElement).then(canvas => {
        // Convert canvas to image URL
        const imageURL = canvas.toDataURL('image/png');

        // Create a temporary link to download the image
        const link = document.createElement('a');
        link.href = imageURL;
        link.download = 'crypto-wallet-health-card.png';
        link.click();

        // Alert user
        alert('Card saved as image! Redirecting...');

        // Hard refresh redirect to index.php
        window.location.href = 'index.php?refresh=' + new Date().getTime();
    });
});