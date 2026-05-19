import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';

const policies = {
    privacy: {
        title: "Privacy Policy",
        content: `
        # Privacy Policy for Ewhore Shop
        Last Updated: May 2026

        Your privacy is important to us. It is Ewhore Shop's policy to respect your privacy regarding any information we may collect from you across our website, https://ewhore.shop, and other sites we own and operate.

        ## 1. Information we collect
        We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.

        ## 2. Use of Information
        We use collected information to provide, maintain, and improve our services, to develop new ones, and to protect Ewhore Shop and our users.

        ## 3. Data Storage
        We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.

        ## 4. Third-party Access
        We don’t share any personally identifying information publicly or with third-parties, except when required to by law.
        `
    },
    terms: {
        title: "Terms of Service",
        content: `
        # Terms of Service
        Last Updated: May 2026

        By accessing the website at https://ewhore.shop, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.

        ## 1. Use License
        Permission is granted to temporarily download one copy of the materials (information or software) on Ewhore Shop's website for personal, non-commercial transitory viewing only.

        ## 2. Disclaimer
        The materials on Ewhore Shop's website are provided on an 'as is' basis. Ewhore Shop makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.

        ## 3. Limitations
        In no event shall Ewhore Shop or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Ewhore Shop's website.
        `
    },
    returns: {
        title: "Return Policy",
        content: `
        # Return & Refund Policy
        Last Updated: May 2026

        Due to the digital nature of our products, Ewhore Shop has a strict return policy.

        ## 1. Digital Assets
        Digital assets, once accessed or downloaded, are non-refundable. Please ensure that you have reviewed the product details thoroughly before making a purchase.

        ## 2. Exceptions
        Refunds may be granted only in exceptional cases such as:
        - Accidental double purchase.
        - The product access link is confirmed to be broken and unfixable by our support team within 48 hours.

        ## 3. Crypto Payments
        Please note that crypto payments are irreversible on the blockchain. Any approved refunds will be processed minus transaction fees.
        `
    }
};

export default function Legal() {
    const { type } = useParams();
    const policy = policies[type as keyof typeof policies] || policies.privacy;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto px-4 py-20"
        >
            <div className="prose dark:prose-invert prose-zinc max-w-none">
                <h1 className="text-4xl font-extrabold tracking-tighter underline decoration-4 decoration-zinc-100 underline-offset-8 mb-12 uppercase">{policy.title}</h1>
                <div className="telegram-bubble p-8 whitespace-pre-wrap text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                    {policy.content.split('\n').map((line, i) => (
                        <p key={i} className="mb-4">{line}</p>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
