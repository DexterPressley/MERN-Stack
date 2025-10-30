import { useState, useEffect } from "react";

function LoggedInName() {
  
  const [userName, setUserName] = useState('');

  //get user data from local storage
  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const fullName = `${user.firstName} ${user.lastName}`;
        setUserName(fullName);
      }
      catch (error) {
        console.error('Error parsing user data from localStorage', error);
        setUserName('User');
      }
    } else {
      setUserName('User');
    }
  }, []);

  function doLogout(event: any): void {
    event.preventDefault();
    localStorage.removeItem('user_data');
    window.location.href = '/';
  }

  return (
    <div id="loggedInDiv">
      <span id="userName">Logged In As John Doe </span><br />
      <button type="button" id="logoutButton" className="buttons" onClick={doLogout}>
        Log Out
      </button>
    </div>
  );
}

export default LoggedInName;

