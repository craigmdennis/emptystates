import React from 'react';

import Layout from '../components/Layout';

const UserSubmissionPage = () => {
  return (
    <Layout>
      <form name="sumbission" method="POST" data-netlify="true" action="/thanks">
        <p>
          <label>
            Your Name: <input type="text" name="name" />
          </label>
        </p>
        <p>
          <label>
            Your Twitter Handle:{' '}
            <input type="text" name="twitter" placeholder="@emptystates" />
          </label>
        </p>
        <p>
          <label>
            Your Email: <input type="email" name="email" />
          </label>
        </p>
        <p>
          <label>
            Message: <textarea name="message"></textarea>
          </label>
        </p>
        <p>
          <label>
            Empty State: <input type="file" name="file" />
          </label>
        </p>
        <p>
          <button type="submit">Send</button>
        </p>
      </form>
    </Layout>
  );
};

export default UserSubmissionPage;
