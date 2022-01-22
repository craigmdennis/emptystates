import React from 'react';

const EditLink = ({ slug }) => {
  const editSlug = slug.substring(2); // Remove the /s/ prefix
  const admin = `http://localhost:8000/admin/#/collections/states/entries${editSlug}index`;
  return <a href={`${admin}`}>Edit</a>;
};

export default EditLink;
