import React, { useState, useEffect } from 'react';
import { Container, Grid, AppBar, Toolbar, Typography } from '@mui/material';
import TradingView from './components/TradingView';
import SignalPanel from './components/SignalPanel';

function App() {
  const [signals, setSignals] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // Connect to WebSocket
    const websocket = new WebSocket('ws://localhost:5000');

    websocket.onopen = () => {
      console.log('Connected to server');
      websocket.send(JSON.stringify({ type: 'SUBSCRIBE_SIGNALS' }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'SIGNAL') {
        setSignals(prevSignals => [...prevSignals, data.signal]);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(websocket);

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, []);

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">
            Smart Trading AI
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" style={{ marginTop: 20 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TradingView />
          </Grid>
          <Grid item xs={12} md={4}>
            <SignalPanel signals={signals} />
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}

export default App;