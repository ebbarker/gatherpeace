import React from 'react';

export default function PrivacyPolicy () {
  return (
    <div className="legal-container">
      <h1>Privacy Policy</h1>
      <p>Effective Date: September 20, 2024</p>

      <h2>1. Information We Collect</h2>
      <p>
        We collect the following types of personal data: your name, email, and any posts or comments
        you make on the Gather Peace platform. Additionally, we collect technical information
        like your IP address and cookies to authenticate and improve your experience on the platform.
      </p>

      <h2>2. Third-Party Services</h2>
      <p>
        We use the following third-party services that may process your data:
      </p>
      <ul>
        <li>
          <strong>Netlify:</strong> Our platform is hosted on Netlify. Your technical data (like IP address)
          may be processed by Netlify to deliver website content. You can read their
          <a href="https://www.netlify.com/privacy/"> Privacy Policy</a>.
        </li>
        <li>
          <strong>Supabase:</strong> We store and manage data (posts, user profiles) through Supabase.
          You can learn more about their data processing in the
          <a href="https://supabase.com/privacy"> Supabase Privacy Policy</a>.
        </li>
        <li>
          <strong>Google Analytics:</strong> We collect anonymized usage data to improve our service via
          Google Analytics. See Google's <a href="https://policies.google.com/privacy"> Privacy Policy</a>.
        </li>
        <li>
          <strong>Microsoft Clarity:</strong> For tracking user behavior and website improvements,
          we may use Clarity. Check their <a href="https://privacy.microsoft.com/en-us/privacystatement"> Privacy Policy</a>.
        </li>
      </ul>

      <p>
        We may also introduce other third-party services to help improve our platform. These services will
        be used in accordance with our privacy policy, though we may not explicitly notify you of each new
        service integration. However, rest assured that any third-party service will be vetted for compliance
        with applicable data protection laws and best practices.
      </p>

      <h2>3. Cookies</h2>
      <p>
        By signing up for Gather Peace, you acknowledge and accept that we will place cookies on your
        device for authentication and tracking purposes. Currently, you must accept all cookies to use
        the platform. We do not offer an option to disable specific cookies at this time.
      </p>

      <h2>4. Communications</h2>
      <p>
        By creating an account on Gather Peace, you agree to receive periodic emails about changes
        to our services. This includes service updates and important announcements.
        You will automatically be subscribed to these notifications. You also have the option to
        <strong> opt in</strong> to our newsletter for additional updates.
      </p>

      <h2>5. Changes to this Privacy Policy</h2>
      <p>
        We may update this policy from time to time. By continuing to use Gather Peace, you agree to
        any changes made to this policy. We will notify you via email about significant changes. You
        can always review the latest version of our Privacy Policy here.
      </p>
    </div>
  );
};
