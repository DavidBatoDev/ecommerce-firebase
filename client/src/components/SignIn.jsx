import React, {useState} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LogoDark from "../assets/Logo/Logo-Dark.png"
import '../styles/SignIn.css'
import axios from 'axios'
import { useStateValue } from '../context/StateProvider'
import Error from './ErrorModal'
import useLocalStorage from '../hooks/useLocalStorage'

function Signin() {
    const navigate = useNavigate();
    const [{user, basket}, dispatch] = useStateValue();
    const [error, setError] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [authToken, setAuthToken] = useLocalStorage('authToken', null)


    const signIn = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.post('api/users/login', {
            email,
            password
        })
        if (res.status !== 201) {
            setError(res.data.message)
        }

        // add existing items from the basket to db
        basket.forEach(async item => {
            console.log('item:', item)
            const resForAddingItemsToCart = await axios.post('api/cart/add', {
                productId: item.id,
                quantity: item.quantity
            }, {
                headers: {
                    Authorization: `Bearer ${res.data.token}`
                }
            })
            if (resForAddingItemsToCart.status === 201) {
                console.log('item added to cart')
            }
        })
        // add existing items from the db to cart
        res.data.cart.forEach(item => {
            dispatch({
                type: 'ADD_TO_CART',
                item
            })
        })
        dispatch({
            type: 'SET_USER',
            user: res.data.user
        })
        setAuthToken(res.data.token)
        navigate('/')
    } catch (error) {
        const errorMessage = error.response.data.message;
        console.log('error:', errorMessage)
        setError(errorMessage)
    }
}

    return (
        <div className='signin's>
            {error && <Error errorMsg={error} clearError={()=>setError('')} />}
            <Link to='/'>
                <img className='signin-logo' src={LogoDark} alt="" />
            </Link>
            <div className='signin--container'>
                <h1>Sign in</h1>
                <form action="">
                    <label htmlFor="">
                        <h5>Email</h5>
                        <input placeholder='Email' value={email} onChange={e => setEmail(e.target.value)} type="text" />
                    </label>

                    <label htmlFor="">
                        <h5>Password</h5>
                        <input placeholder='Password' value={password} onChange={e => setPassword(e.target.value)} type="password" />
                    </label>
                    <button onClick={signIn} className='signin--signInButton'>Sign In</button>
                </form>

                <p>
                    By signing-in you agree to Demo Ecommerce App's
                    Conditions of Use & Sale, Please see our Privacy Notice, 
                    our Cookies Notice and our interest-Based Ads Notice
                </p>

                <Link to="/sign-up">
                    <button className='signin--registerButton'>Create Account</button>
                </Link> 
            </div>
        </div>
    )
}

export default Signin
