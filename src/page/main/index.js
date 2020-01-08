import React, { useState, useEffect } from 'react';
import './index.scss'

function Main() {
  const [NeighborPage, setNeighborPage] = useState(null)

  useEffect(() => {
    import(/* webpackChunkName: 'page-neighbor' */'../neighbor').then(({ default: component }) => {
      setNeighborPage(React.createElement(component))
    });
  }, [])

  return NeighborPage
    ? NeighborPage
    : <div>Loading...</div>;
}

export default Main
