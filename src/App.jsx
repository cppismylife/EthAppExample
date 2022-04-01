import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import './App.css';
import abi from './utils/WavePortal.json';

function Error(props) {
	return <p style={{ color: 'red', textAlign: 'center' }}>{props.error}</p>;
}

function Result(props) {
	return (
		<>
			<h1 style={{ textAlign: 'center' }}>Total waves count: {props.text}</h1>
			<h3 style={{ textAlign: 'center' }}>Last TxHash: {props.txhash}</h3>
		</>
	);
}

export default function App() {
	const contractAddress = '0x8cC8dA525b0DD46Bea002D391134E5da890b1CcA';
	const contractABI = abi.abi;
	const [currentAccount, setCurrentAccount] = useState('');
	const [waveError, alertWaveError] = useState('');
	const [wavesCount, setWavesCount] = useState(null);
	const [allWaves, setAllWaves] = useState([]);
	const [message, setMessage] = useState('');

	const checkIfWalletIsConnected = async () => {
		const { ethereum } = window;
		if (!ethereum) {
			console.log('Make sure you have metamask!');
			return;
		} else {
			console.log('We have the ethereum object', ethereum);
		}
		const accounts = await ethereum.request({ method: 'eth_accounts' });
		if (accounts.length !== 0) {
			const account = accounts[0];
			console.log('Found an authorized account:', account);
			setCurrentAccount(account);
			getAllWaves();
		} else {
			console.log('No authorized account found');
		}
	};

	const getWallet = () => {
		const { ethereum } = window;
		if (!ethereum) alert('Get MetaMask!');
		return ethereum;
	};

	const connectWallet = async () => {
		const ethereum = getWallet();
		if (!ethereum) return;
		const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
		console.log('Connected', accounts[0]);
		setCurrentAccount(accounts[0]);
		getAllWaves();
	};

	const wave = async () => {
		const ethereum = getWallet();
		if (!ethereum) return;
		const provider = new ethers.providers.Web3Provider(ethereum);
		const signer = provider.getSigner();
		const wavePortalContract = new ethers.Contract(
			contractAddress,
			contractABI,
			signer
		);
		try {
			const waveTxn = await wavePortalContract.wave(message, {
				gasLimit: 300000
			});
			console.log('Mining...', waveTxn.hash);
			await waveTxn.wait();
			console.log('Mined -- ', waveTxn.hash);
			let count = await wavePortalContract.getTotalWaves();
			setWavesCount({ count: count.toNumber(), txhash: waveTxn.hash });
			setMessage('');
			getAllWaves();
		} catch (err) {
			alertWaveError(err.toString());
			setTimeout(() => {
				alertWaveError('');
			}, 5000);
		}
	};

	const handleMessageChange = event => {
		setMessage(event.target.value);
	};

	const getAllWaves = async () => {
		const ethereum = getWallet();
		if (!ethereum) return;
		const provider = new ethers.providers.Web3Provider(ethereum);
		const signer = provider.getSigner();
		const wavePortalContract = new ethers.Contract(
			contractAddress,
			contractABI,
			signer
		);

		/*
     * Call the getAllWaves method from your Smart Contract
     */
		const waves = await wavePortalContract.getAllWaves();

		/*
     * We only need address, timestamp, and message in our UI so let's
     * pick those out
     */
		let wavesCleaned = [];
		waves.forEach(wave => {
			wavesCleaned.push({
				address: wave.waver,
				timestamp: new Date(wave.timestamp * 1000),
				message: wave.message
			});
		});

		/*
     * Store our data in React State
     */
		setAllWaves(wavesCleaned);
	};

	useEffect(() => {
		checkIfWalletIsConnected();
		let wavePortalContract;

		const onNewWave = (from, timestamp, message) => {
			console.log('NewWave', from, timestamp, message);
			setAllWaves(prevState => [
				...prevState,
				{
					address: from,
					timestamp: new Date(timestamp * 1000),
					message: message
				}
			]);
		};

		if (window.ethereum) {
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			const signer = provider.getSigner();

			wavePortalContract = new ethers.Contract(
				contractAddress,
				contractABI,
				signer
			);
			wavePortalContract.on('NewWave', onNewWave);
		}

		return () => {
			if (wavePortalContract) {
				wavePortalContract.off('NewWave', onNewWave);
			}
		};
	}, []);

	return (
		<div>
			<div className="mainContainer">
				<div className="dataContainer">
					{!currentAccount ? (
						<button className="connectButton" onClick={connectWallet}>
							Connect wallet
						</button>
					) : (
						<h3 style={{ textAlign: 'center' }}>Wallet: {currentAccount}</h3>
					)}
					<div className="header">👋 Hey there!</div>
					{currentAccount ? (
						<>
							<button className="waveButton" onClick={wave}>
								Wave at Me
							</button>
							<input
								type="text"
								placeholder="Type your message"
								onChange={handleMessageChange}
							/>
						</>
					) : null}
					{waveError ? (
						<Error error={waveError} />
					) : wavesCount ? (
						<Result text={wavesCount.count} txhash={wavesCount.txhash} />
					) : null}
					{allWaves.map((wave, index) => {
						return (
							<div
								key={index}
								style={{
									backgroundColor: 'OldLace',
									marginTop: '16px',
									padding: '8px'
								}}
							>
								<div>Address: {wave.address}</div>
								<div>Time: {wave.timestamp.toDateString()}</div>
								<div>Message: {wave.message}</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
