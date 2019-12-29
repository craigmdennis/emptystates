import React from "react";
import { graphql } from "gatsby";
import Helmet from "react-helmet";
import Img from "gatsby-image";
import _ from "lodash";
import Header from "../components/header";
import Layout from "../components/layout";
// import TagList from '../components/taglist'
import styles from "./post.module.css";

const PostTemplate = ({
  data: {
    site: {
      siteMetadata: { title },
    },
    statesYaml,
  },
}) => {
  const state = statesYaml;
  const classes = _.includes(state.tags, "Desktop") ? styles.wide : styles.item;

  return (
    <Layout>
      <Helmet title={`${state.title} | ${title}`} />
      <Header title={state.title} />
      {state.description && <p>{state.description}</p>}
      <Img
        className={classes}
        alt={state.image.alt ? state.image.alt : ""}
        fluid={state.image.childImageSharp.fluid}
        key={state.image}
      />
      <div>
        <small>{state.date}</small>
      </div>
      {/* <TagList tags={state.tags} /> */}
    </Layout>
  );
};

export default PostTemplate;

export const pageQuery = graphql`
  query PostQuery {
    site {
      siteMetadata {
        title
      }
    }
    statesYaml {
      title
      date(formatString: "MMMM DD, YYYY")
      description
      tags
      fields {
        slug
      }
      image {
        childImageSharp {
          fluid(maxWidth: 800) {
            aspectRatio
            ...GatsbyImageSharpFluid
          }
        }
      }
    }
  }
`;
