import React, { useState } from 'react';

const app_name = 'colorsdigitalocean.xyz';

function buildPath(route: string): string {
  // When running "npm run dev" locally:
  if (import.meta.env.MODE === 'development') {
    return 'http://localhost:5000/' + route;
  }
  // When running the built site on the droplet (HTTPS enabled)
  return 'https://' + app_name + '/' + route;
}

function CardUI() {
  let _ud: any = localStorage.getItem('user_data');
  let ud = JSON.parse(_ud);
  let userId: string = ud.id;

  const [message, setMessage] = useState('');
  const [searchResults, setResults] = useState('');
  const [cardList, setCardList] = useState('');
  const [search, setSearchValue] = React.useState('');
  const [card, setCardNameValue] = React.useState('');

  function handleSearchTextChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setSearchValue(e.target.value);
  }

  function handleCardTextChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setCardNameValue(e.target.value);
  }

  async function addCard(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
    e.preventDefault();
    const obj = { userId: userId, card: card };
    const js = JSON.stringify(obj);

    try {
      const response = await fetch(buildPath('api/addcard'), {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' },
      });

      const txt = await response.text();
      const res = JSON.parse(txt);

      if (res.error.length > 0) {
        setMessage('API Error: ' + res.error);
      } else {
        setMessage('Card has been added');
      }
    } catch (error: any) {
      setMessage(error.toString());
    }
  }

  async function searchCard(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
    e.preventDefault();
    const obj = { userId: userId, search: search };
    const js = JSON.stringify(obj);

    try {
      const response = await fetch(buildPath('api/searchcards'), {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' },
      });

      const txt = await response.text();
      const res = JSON.parse(txt);

      const _results = res.results;
      let resultText = '';

      for (let i = 0; i < _results.length; i++) {
        resultText += _results[i];
        if (i < _results.length - 1) {
          resultText += ', ';
        }
      }

      setResults('Card(s) have been retrieved');
      setCardList(resultText);
    } catch (error: any) {
      alert(error.toString());
      setResults(error.toString());
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

