import React from 'react';

import Layout from '../components/layout';
import SEO from '../components/seo';
import Header from '../components/header';
import Container from '../components/container';

const NotFoundPage = () => {
  const text =
    "There should probably be an empty state here but... the page you're looking for doesn't exist.";
  return (
    <Layout>
      <SEO title="404: Not found" />
      <Container>
        <Header title="Page Not Found" />
        <p>{text}</p>
      </Container>
    </Layout>
  );
};

export default NotFoundPage;
