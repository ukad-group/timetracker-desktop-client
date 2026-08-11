// Jest DOM matchers for better assertions
import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";

// react-router v7 expects Web Encoding APIs that jsdom may not provide
Object.assign(global, { TextEncoder, TextDecoder });
