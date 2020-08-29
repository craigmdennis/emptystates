import React from 'react';

import Layout from '../components/Layout';

const UserSubmissionPage = () => {
  return (
    <Layout>
      <form
        name="User Submissions"
        method="POST"
        action="/thanks/"
        encType="multipart/form-data"
        data-netlify="true"
      >
        <div>
          <label>
            Your Name: <input type="text" name="name" />
          </label>
        </div>
        <div>
          <label>
            Your Twitter Handle:{' '}
            <input type="text" name="twitter" placeholder="@emptystates" />
          </label>
        </div>
        <div>
          <label>
            Your Email: <input type="email" name="email" />
          </label>
        </div>
        <div>
          <label>
            Message: <textarea name="message"></textarea>
          </label>
        </div>
        <div>
          <label>
            Empty State: <input type="file" name="file" />
          </label>
        </div>
        <div>
          <button type="submit">Send</button>
        </div>
      </form>
    </Layout>
  );
};

export default UserSubmissionPage;
