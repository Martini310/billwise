import React from "react";
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import CssBaseline from '@material-ui/core/CssBaseline';
import { makeStyles } from "@material-ui/core/styles";


const useStyles = makeStyles((theme) => {
    return {
        appBar: {
            borderBottom: "10px solid {theme.palette.divider}",
        },
}});

export function Header() {
    const classes = useStyles();
    return (
        <>
            <CssBaseline />
            <AppBar
                position="static"
                bg-color="green"
                elevation={0}
                className={classes.appBar}>
                <Toolbar>
                    <Typography variant="h6" color="inherit" noWrap>
                        BillWise
                    </Typography>
                </Toolbar>
            </AppBar>
        </>
    )
}