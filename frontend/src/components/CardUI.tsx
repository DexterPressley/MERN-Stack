import React, { useState } from 'react';
import axios from 'axios';
import { buildPath } from './Path';
import { retrieveToken, storeToken } from '../tokenStorage';

function CardUI() {
  const _ud = localStorage.getItem('user_data');
  const ud = _ud ? JSON.parse(_ud) : null;
  // prefer new key (userId), fallback to old (id)
  const userId: number = (ud?.userId ?? ud?.id) ?? -1;

  const [message, setMessage] = useState<string>('');
  const [searchResults, setResults] = useState<string>('');
  const [cardList, setCardList] = useState<string>('');
  const [search, setSearchValue] = React.useState<string>('');
  const [card, setCardNameValue] = React.useState<string>('');

  function handleSearchTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchValue(e.target.value);
  }

  function handleCardTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCardNameValue(e.target.value);
  }

  async function addCard(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    try {
      const { data: res } = await axios.post(
        buildPath('api/addcard'),
        {
          userId,
          card,
          jwtToken: retrieveToken(),
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res?.error && res.error.length > 0) {
        setMessage('API Error: ' + res.error);
      } else {
        setMessage('Card has been added');
      }

      // store refreshed token if present
      if (res?.jwtToken) storeToken(res.jwtToken);
    } catch (err: any) {
      console.error(err);
      setMessage('Network or server error adding card.');
    }
  }

  async function searchCard(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    try {
      const { data: res } = await axios.post(
        buildPath('api/searchcards'),
        {
          userId,
          search,
          jwtToken: retrieveToken(),
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const resultsArr: string[] = res?.results || [];
      setResults('Card(s) have been retrieved');
      setCardList(resultsArr.join(', '));

      if (res?.jwtToken) storeToken(res.jwtToken);
    } catch (err: any) {
      console.error(err);
      setResults('Network or server error searching cards.');
    }
  }

  return (
    <div id="cardUIDiv">
      <br />
      Search:{' '}
      <input
        type="text"
        id="searchText"
        placeholder="Card To Search For"
        onChange={handleSearchTextChange}
      />
      <button
        type="button"
        id="searchCardButton"
        className="buttons"
        onClick={searchCard}
      >
        Search Card
      </button>
      <br />
      <span id="cardSearchResult">{searchResults}</span>
      <p id="cardList">{cardList}</p>
      <br />
      <br />
      Add:{' '}
      <input
        type="text"
        id="cardText"
        placeholder="Card To Add"
        onChange={handleCardTextChange}
      />
      <button
        type="button"
        id="addCardButton"
        className="buttons"
        onClick={addCard}
      >
        Add Card
      </button>
      <br />
      <span id="cardAddResult">{message}</span>
    </div>
  );
}

export default CardUI;

