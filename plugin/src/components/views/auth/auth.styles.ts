/** @format */

import { css } from 'styled-components';
import { AuthProps } from './index';

/**
 * Base styles for the auth component
 *
 * @param _ The auth properties object
 * @return Base styles for the auth component
 */
const baseStyles = (_: Partial<AuthProps>) => css``;

/**
 * The auth component styles
 *
 * @param props The auth properties object
 * @return Styles for the auth component
 */
export const styles = (props: Partial<AuthProps>) => css`
    ${baseStyles(props)}
`;
