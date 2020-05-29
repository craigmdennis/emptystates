import React from 'react';

import Layout from '../components/Layout';
import SEO from '../components/Seo';
import Header from '../components/Header';
import Container from '../components/Container';

const NotFoundPage = () => (
  <Layout>
    <SEO title="404: Not found" />
    <Container>
      <Header title="Page Not Found" />
      <p>You just hit a route that doesn&#39;t exist... the sadness.</p>
    </Container>
  </Layout>
);

export default NotFoundPage;
