import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    root: '.',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                index: resolve(__dirname, 'index.html'),
                home: resolve(__dirname, 'home.html'),
                shop: resolve(__dirname, 'shop.html'),
                auctions: resolve(__dirname, 'auctions.html'),
                paintings: resolve(__dirname, 'paintings.html'),
                checkout: resolve(__dirname, 'checkout.html'),
                checkoutSecure: resolve(__dirname, 'checkout-secure.html'),
                orderConfirmation: resolve(__dirname, 'order-confirmation.html'),
                account: resolve(__dirname, 'account.html'),
                signup: resolve(__dirname, 'signup.html'),
                admin: resolve(__dirname, 'admin.html'),
                contact: resolve(__dirname, 'contact.html'),
                about: resolve(__dirname, 'about.html'),
                privacy: resolve(__dirname, 'privacy.html'),
                terms: resolve(__dirname, 'terms.html'),
                support: resolve(__dirname, 'support.html'),
                passwordReset: resolve(__dirname, 'password-reset.html'),
                passwordManagement: resolve(__dirname, 'password-management.html'),
                eagleShop: resolve(__dirname, 'Eagle_Shop.html'),
                smokeTest: resolve(__dirname, 'smoke-test.html'),
            },
        },
    },
});
