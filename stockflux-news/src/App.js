import React, { useRef, useState, useEffect, useReducer } from 'react';
import Components from 'stockflux-components';
import { StockFlux, StockFluxHooks } from 'stockflux-core';
import { useInterApplicationBusSubscribe } from 'openfin-react-hooks';

import NewsItem from './components/news-item/NewsItem';

import styles from './App.module.css';

const ALL = { uuid: '*' };

const SEARCHING = 'searching';
const SUCCESS = 'success';
const ERROR = 'error';

const MIN_HEIGHT = 400;
const TITLEBAR_HEIGHT = 35;
const SYMBOL_HEADER_HEIGHT = 40;
const SPINNER_CONTAINER_HEIGHT = 60;

const initialSearchState = {
  isSearching: false,
  hasErrors: false,
  results: []
};

function App() {
  const searchReducer = (state, { type, results }) => {
    switch (type) {
      case SEARCHING:
        return {
          ...state,
          hasErrors: false,
          isSearching: true,
          results: []
        };
      case SUCCESS:
        return {
          ...state,
          isSearching: false,
          results
        };
      case ERROR:
        return {
          ...state,
          hasErrors: true,
          isSearching: false,
          results: []
        };
      default:
        throw new Error();
    }
  };

  const [searchState, dispatch] = useReducer(searchReducer, initialSearchState);
  const [symbol, setSymbol] = StockFluxHooks.useLocalStorage(
    'newsSymbol',
    null
  );
  const [parentUuid, setParentUuid] = useState(null);
  const [listenerSymbol, setListenerSymbol] = useState(null);
  const listContainer = useRef(null);

  const { isSearching, results } = searchState;

  window.fin.Window.getCurrentSync()
    .getOptions()
    .then(options => {
      if (listenerSymbol !== options.customData.symbol) {
        setListenerSymbol(options.customData.symbol);
        setParentUuid({ uuid: options.uuid });
      }
    });
  const { data } = useInterApplicationBusSubscribe(
    parentUuid ? parentUuid : ALL,
    'stockFluxNews:' + listenerSymbol
  );
  if (data && data.message) {
    if (data.message.symbol && symbol !== data.message.symbol) {
      setSymbol(data.message.symbol);
    }
  }

  useEffect(() => {
    if (symbol) {
      dispatch({ type: SEARCHING });
      StockFlux.getSymbolNews(symbol)
        .then(results => {
          dispatch({ type: SUCCESS, results });
        })
        .catch(() => dispatch({ type: ERROR }));
    }
  }, [symbol]);

  useEffect(() => {
    (async () => {
      const win = await window.fin.Window.getCurrent();
      const bounds = await win.getBounds();
      if (results.length === 0 && isSearching) {
        win.resizeTo(
          bounds.width,
          Math.min(
            SPINNER_CONTAINER_HEIGHT + TITLEBAR_HEIGHT + SYMBOL_HEADER_HEIGHT,
            MIN_HEIGHT
          )
        );
      } else {
        win.resizeTo(
          bounds.width,
          Math.min(
            listContainer.current.scrollHeight +
              TITLEBAR_HEIGHT +
              SYMBOL_HEADER_HEIGHT,
            MIN_HEIGHT
          )
        );
      }
    })();
  });

  return (
    <div className={styles.stockfluxNews}>
      <Components.Titlebar />
      <div className={styles.header}>{symbol}</div>
      <Components.ScrollWrapperY>
        <div className={styles.container} ref={listContainer}>
          {isSearching ? (
            <div className={styles.spinContainer}>
              <Components.Spinner />
            </div>
          ) : results.length > 0 ? (
            results.map((newsItem, index) => (
              <NewsItem
                key={index}
                headline={newsItem.title}
                source={newsItem.source}
                copy={newsItem.summary}
                link={newsItem.url}
              />
            ))
          ) : (
            <div className={styles.noArticles}>
              Sorry, no news stories found for that symbol.
            </div>
          )}
        </div>
      </Components.ScrollWrapperY>
    </div>
  );
}

export default App;
