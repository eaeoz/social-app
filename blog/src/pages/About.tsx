import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import '../styles/StaticPage.css';

export default function About() {
  return (
    <>
      <Helmet>
        <title>About - {import.meta.env.VITE_SITE_NAME || "Sedat's Blog"}</title>
        <meta name="description" content="Learn more about our blog and our mission" />
      </Helmet>

      <motion.div
        className="static-page-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="static-page-content">
          <h1>About Us</h1>
          
          <section>
            <h2>Welcome to {import.meta.env.VITE_SITE_NAME || "Our Blog"}</h2>
            <p>
              We are passionate about technology, software development, and sharing knowledge 
              with the community. Our blog is dedicated to providing high-quality content that 
              helps developers and tech enthusiasts stay up-to-date with the latest trends and 
              best practices.
            </p>
          </section>

          <section>
            <h2>Our Mission</h2>
            <p>
              Our mission is to create a platform where developers can learn, grow, and share 
              their experiences. We believe in the power of knowledge sharing and aim to 
              contribute to the developer community by creating valuable, insightful content.
            </p>
          </section>

          <section>
            <h2>What We Cover</h2>
            <ul>
              <li>Web Development (Frontend & Backend)</li>
              <li>Mobile Application Development</li>
              <li>Software Architecture & Design Patterns</li>
              <li>Programming Languages & Frameworks</li>
              <li>DevOps & Cloud Technologies</li>
              <li>Best Practices & Code Quality</li>
            </ul>
          </section>

          <section>
            <h2>Get In Touch</h2>
            <p>
              Have questions or suggestions? We'd love to hear from you! Feel free to 
              reach out through our contact page.
            </p>
          </section>
        </div>
      </motion.div>
    </>
  );
}
