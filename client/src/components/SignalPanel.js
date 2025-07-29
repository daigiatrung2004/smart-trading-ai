import React from 'react';
import { Paper, Typography, List, ListItem, ListItemText, Divider } from '@mui/material';

const SignalPanel = ({ signals }) => {
  return (
    <Paper style={{ padding: 16, marginTop: 16 }}>
      <Typography variant="h6" gutterBottom>
        Trading Signals
      </Typography>
      <List>
        {signals && signals.map((signal, index) => (
          <React.Fragment key={index}>
            <ListItem>
              <ListItemText
                primary={`${signal.type} ${signal.direction}`}
                secondary={`Entry: ${signal.entry} | Stop: ${signal.stopLoss} | Target: ${signal.target}`}
              />
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default SignalPanel;