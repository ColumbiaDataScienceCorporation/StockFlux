import React from 'react';
import Components from 'stockflux-components';
import './Table.css';
import { FetchState } from '../../../enums';
import PropTypes from 'prop-types';
import Body from './body/Body';
import Head from './head/Head';

const Table = props => {
  return (
    <table>
      <Head />
      {props.state.fetchStatus === FetchState.FETCHING ? (
        <div className="spinner-container">
          <Components.LargeSpinner />
        </div>
      ) : (
        <Body {...props} />
      )}
    </table>
  );
};

Table.propTypes = {
  location: PropTypes.object.isRequired
};

export default Table;
