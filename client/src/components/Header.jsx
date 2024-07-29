import React, { useEffect, useState } from 'react'
import LogoDark from '../assets/Logo/Logo-Dark.png'
import SearchIcon from '@mui/icons-material/Search';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import '../styles/Header.css'
import { Link, useParams } from 'react-router-dom';
import {auth} from '../Firebase'
import {signOut} from 'firebase/auth'
import { useStateValue } from '../context/StateProvider';

function Header() {
    const [{ basket, user }, dispatch] = useStateValue();
    const category = useParams()

    const handleAuthentication = () => {
        if (auth.currentUser) {
            signOut(auth)
                .then(() => {
                    console.log("Signed out");
                })
                .catch((error) => {
                    console.error("Error signing out", error);
                });
        }
    };

    const itemsQuantity = basket.map(item => item.quantity).reduce((a, b) => a + b, 0)

    console.log(basket.map(item => item.quantity))

  return (
    <div className='header'>
        <div className='header--container' >
            <Link to="/">
                <img className='header--logo' src={LogoDark} alt="logo" />
            </Link>
            <div className="header--search">
                <input className='header--searchInput' type="text" placeholder={category.category ? `Search item in ${category.category}` : "Search"} />
                <SearchIcon className='header--searchIcon' />
            </div>
            <div className="header--nav">
                {user ? (
                    <div onClick={handleAuthentication} className="header--options">
                        <span className='header--optionsLineOne'>Hello {user.email.split("@")[0]}</span>
                        <span className='header--optionsLineTwo'>Sign Out</span>
                    </div>
                ) : (
                    <Link to='/sign-in'>
                        <div className="header--options">
                            <span className='header--optionsLineOne'>Hello Guest</span>
                            <span className='header--optionsLineTwo'>Sign In</span>
                        </div>
                    </Link>
                )}
                <div className="header--options">
                    <span className='header--optionsLineOne'>Returns</span>
                    <span className='header--optionsLineTwo'>& Orders</span>
                </div>
                <Link to='/basket'>
                <div className="header--optionsBasket">
                    <ShoppingBasketIcon />
                    <span className='header--optionsLineTwo header--basketCount'>{itemsQuantity}</span>
                </div>
                </Link>
            </div>
        </div>
    </div>
  )
}

export default Header
