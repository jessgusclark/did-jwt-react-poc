import { useState } from 'react'
import { Resolver } from 'did-resolver'
import { getResolver } from 'ethr-did-resolver'
import Eth from 'ethjs-query'
import './App.css';
import { createJWT, verifyJWT } from 'jesse-did-jwt';
import { fromRpcSig } from 'ethereumjs-util';


function App() {
  const [address, setAddress] = useState(null)
  const [credential, setCredential] = useState(null)
  const [presentation, setPresentation] = useState(null)
  const [message, setMessage] = useState(null)

  const providerConfig = {
    networks: [
      { name: 'rsk:testnet', rpcUrl: 'https://did.testnet.rsk.co:4444', registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b' },
      { name: 'rsk', rpcUrl: 'https://did.rsk.co:4444', registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b' },
      { name: 'mainnet', rpcUrl: 'https://mainnet.infura.io/v3/8c2e55bc61b94ad781c4deae786c4f58', registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b' }
    ]
  }
  const resolver = new Resolver(getResolver(providerConfig))
  const signer = (data) => window.ethereum.request({ method: 'personal_sign', params: [data, address] })
    .then(fromRpcSig)
    .then(({ v, r, s }) => ({
      r: r.toString('hex'),
      s: s.toString('hex'),
      recoveryParam: v
    }))

  const handleError = (error) => setMessage(`ERROR: ${error.message}`);

  let eth;
  const handleConnect = () => {
    if (window.ethereum) {
      window.ethereum.enable();
      eth = new Eth(window.ethereum);
      eth.accounts().then(accounts => setAddress(accounts[0]))
    }  
  }

  const createCredential = () => {
    createJWT(
      { exp: 1957463421, name: 'uPort Developer'},
      {alg: 'ES256K', issuer: `did:ethr:rsk:testnet:${address}`, signer}
    )
      .then((response) => setCredential(response))
      .catch(handleError)
  }

  const createPresentation = () => {
    const vpPayload = {
      vp: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiablePresentation'],
        verifiableCredential: [credential],
        nbf: Math.floor(new Date().getTime() / 1000),
        exp: Math.floor(new Date().getTime() / 1000) + 3600
      }
    }
    createJWT(vpPayload, {alg: 'ES256K', issuer: `did:ethr:rsk:testnet:${address}`, signer})
      .then((response) => setPresentation(response))
      .catch(handleError)
  }

  const verifyCredential = (jwt) => {
    setMessage('loading...')
    verifyJWT(jwt, {ethSign: true, resolver: resolver, })
      .then(res => {
        setMessage('SUCCESS!')
        console.log('res', res)
      })
      .catch(handleError)
  }

  return (
    <div className="App">
      <button onClick={handleConnect}>Connect</button>
      <p><strong>Address: </strong>{address}</p>
      <hr/>
      <button disabled={!address} onClick={createCredential}>Create Credential</button>
      <div style={{wordBreak: 'break-all'}}>{credential}</div>
      <hr/>
      <div>
        <button disabled={!credential} onClick={() => verifyCredential(credential)}>Verify Credential</button>
      </div>
      <hr/>
      <button disabled={!credential} onClick={createPresentation}>Create Presentation</button>
      <div style={{wordBreak: 'break-all'}}>{presentation}</div>
      <hr/>
      <button disabled={!credential} onClick={() => verifyCredential(presentation)}>Verify Presentation</button>
      <hr />
      {message && <span>{message}</span>}
    </div>
  );
}

export default App;