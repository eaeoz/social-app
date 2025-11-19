import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import '../styles/StaticPage.css';

export default function Privacy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - {import.meta.env.VITE_SITE_NAME || "Sedat's Blog"}</title>
        <meta name="description" content="Our privacy policy and how we handle your data" />
      </Helmet>

      <motion.div
        className="static-page-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="static-page-content">
          <h1>Privacy Policy</h1>
          
          <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2>Introduction</h2>
            <p>
              We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you about how we look after your personal data 
              and tell you about your privacy rights.
            </p>
          </section>

          <section>
            <h2>Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul>
              <li>Contact information (name, email address) when you submit a contact form</li>
              <li>Usage data (pages visited, time spent, etc.) through analytics</li>
              <li>Technical data (IP address, browser type, device information)</li>
            </ul>
          </section>

          <section>
            <h2>How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Respond to your inquiries and requests</li>
              <li>Improve our website and user experience</li>
              <li>Analyze website traffic and usage patterns</li>
              <li>Send relevant updates (if you've opted in)</li>
            </ul>
          </section>

          <section>
            <h2>Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our website. 
              You can instruct your browser to refuse all cookies or to indicate when a cookie 
              is being sent.
            </p>
          </section>

          <section>
            <h2>Third-Party Services</h2>
            <p>We may use third-party services such as:</p>
            <ul>
              <li>Google Analytics for website analytics</li>
              <li>Google AdSense for advertisements</li>
              <li>Appwrite for data storage</li>
            </ul>
            <p>These services have their own privacy policies.</p>
          </section>

          <section>
            <h2>Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information. 
              However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2>Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
            </ul>
          </section>

          <section>
            <h2>Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us 
              through our contact form.
            </p>
          </section>
        </div>
      </motion.div>
    </>
  );
}
