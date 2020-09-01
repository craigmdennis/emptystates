import React from 'react';
import Layout from '../components/layout';

const UserSubmissionPage = () => {
  return (
    <Layout>
      <form
        className="w-full max-w-lg"
        name="User Submissions"
        method="POST"
        action="/thanks"
        encType="multipart/form-data"
        data-netlify="true"
      >
        <input type="hidden" name="form-name" value="User Submissions" />

        <div className="flex flex-wrap -mx-3 mb-6">
          <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
            <label
              className="block uppercase tracking-wide primary-text-color text-xs font-bold mb-2"
              htmlFor="grid-first-name"
            >
              Name
            </label>
            <input
              className="appearance-none block w-full bg-gray-200 primary-text-color border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
              id="grid-first-name"
              type="text"
              placeholder="Jane Doe"
            />
          </div>

          <div className="w-full md:w-1/2 px-3">
            <label
              className="block uppercase tracking-wide primary-text-color text-xs font-bold mb-2"
              htmlFor="grid-twitter"
            >
              Twitter Handle
            </label>
            <input
              className="appearance-none block w-full bg-gray-200 primary-text-color border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
              id="grid-twitter"
              type="text"
              placeholder="@emptystates"
            />
          </div>
        </div>
        <div className="flex flex-wrap -mx-3 mb-6">
          <div className="w-full px-3">
            <label
              className="block uppercase tracking-wide primary-text-color text-xs font-bold mb-2"
              htmlFor="grid-file"
            >
              Screenshot
            </label>
            <input
              className="appearance-none block w-full bg-gray-200 primary-text-color border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
              id="grid-file"
              type="file"
            />
            <p className="text-gray-600 text-xs italic">
              Please make sure it doesn&apos;t contain sensitive information.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap -mx-3 mb-6">
          <div className="w-full px-3">
            <label
              className="block uppercase tracking-wide primary-text-color text-xs font-bold mb-2"
              htmlFor="grid-comment"
            >
              Description
            </label>
            <textarea
              className="appearance-none block w-full bg-gray-200 primary-text-color border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
              rows="3"
              id="grid-comment"
            />
          </div>
        </div>
        <div className="flex flex-wrap -mx-3 mb-2">
          <div className="w-full px-3 mb-6 md:mb-0">
            <label
              className="block uppercase tracking-wide primary-text-color text-xs font-bold mb-2"
              htmlFor="grid-twitter"
            >
              Website / Link
            </label>
            <input
              className="appearance-none block w-full bg-gray-200 primary-text-color border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
              id="grid-twitter"
              type="text"
              placeholder="https://emptystat.es"
            />
            <p className="text-gray-600 text-xs italic">
              A link to the website or app that the screenshot is from.
            </p>
          </div>
        </div>
        <input
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          value="Submit"
        />
      </form>
    </Layout>
  );
};

export default UserSubmissionPage;
