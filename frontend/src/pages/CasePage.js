import React from 'react';
import { useParams } from 'react-router-dom';

const CasePage = () => {
  const { id } = useParams();
  return <h1>Сторінка кейса {id}</h1>;
};

export default CasePage;
