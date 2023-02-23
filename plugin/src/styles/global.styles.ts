/** @format */

import { createGlobalStyle } from 'styled-components';
import { resetStyles } from './reset.styles';
import 'bootstrap-icons/font/bootstrap-icons.css';

export const GlobalStyles = createGlobalStyle`
    ${resetStyles}

    button {
        cursor: pointer;
    }

    i {
        color: inherit;
    }

    body {
        background: transparent !important;
    }
`;
