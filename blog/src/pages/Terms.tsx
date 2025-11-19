import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import '../styles/StaticPage.css';

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms of Service - {import.meta.env.VITE_SITE_NAME || "Sedat's Blog"}</title>
        <meta name="description" content="Terms and conditions for using our blog" />
      </Helmet>

      <motion.div
        className="static-page-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="static-page-content">
          <h1>Terms of Service</h1>
          
          <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2>Agreement to Terms</h2>
            <p>
              By accessing and using this website, you accept and agree to be bound by the 
              terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2>Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials on our 
              website for personal, non-commercial transitory viewing only.
            </p>
            <p>This license shall automatically terminate if you violate any of these restrictions.</p>
          </section>

          <section>
            <h2>Disclaimer</h2>
            <p>
              The materials on this website are provided on an 'as is' basis. We make no warranties, 
              expressed or implied, and hereby disclaim and negate all other warranties including, 
              without limitation, implied warranties or conditions of merchantability, fitness for 
              a particular purpose, or non-infringement of intellectual property.
            </p>
          </section>

          <section>
            <h2>Limitations</h2>
            <p>
              In no event shall we or our suppliers be liable for any damages (including, without 
              limitation, damages for loss of data or profit, or due to business interruption) 
              arising out of the use or inability to use the materials on our website.
            </p>
          </section>

          <section>
            <h2>Accuracy of Materials</h2>
            <p>
              The materials appearing on our website could include technical, typographical, or 
              photographic errors. We do not warrant that any of the materials on our website are 
              accurate, complete, or current.
            </p>
          </section>

          <section>
            <h2>Links</h2>
            <p>
              We have not reviewed all of the sites linked to our website and are not responsible 
              for the contents of any such linked site. The inclusion of any link does not imply 
              endorsement by us of the site.
            </p>
          </section>

          <section>
            <h2>Modifications</h2>
            <p>
              We may revise these terms of service for our website at any time without notice. 
              By using this website you are agreeing to be bound by the then current version of 
              these terms of service.
            </p>
          </section>

          <section>
            <h2>Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the 
              applicable laws and you irrevocably submit to the exclusive jurisdiction of the 
              courts in that location.
            </p>
          </section>

          <section>
            <h2>Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us through 
              our contact form.
            </p>
          </section>
        </div>
      </motion.div>
    </>
  );
}
