/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { render, waitFor } from '@testing-library/react';
import { supersetTheme, ThemeProvider } from '@superset-ui/core';
import { EchartsHandler } from '../../src/types';
import Echart from '../../src/components/Echart';

// Mock echarts
const mockSetOption = jest.fn();
const mockResize = jest.fn();
const mockDispose = jest.fn();
const mockGetZr = jest.fn(() => ({
  on: jest.fn(),
  off: jest.fn(),
}));

jest.mock('echarts/core', () => ({
  ...jest.requireActual('echarts/core'),
  init: jest.fn(() => ({
    setOption: mockSetOption,
    resize: mockResize,
    dispose: mockDispose,
    getZr: mockGetZr,
    on: jest.fn(),
    off: jest.fn(),
    dispatchAction: jest.fn(),
  })),
}));

const defaultProps = {
  height: 400,
  width: 600,
  echartOptions: {
    series: [
      {
        data: [1, 2, 3],
      },
    ],
  },
  eventHandlers: {},
  selectedValues: {},
};

describe('Echart component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should call setOption with notMerge: false to enable animations', async () => {
    const { rerender } = render(
      <ThemeProvider theme={supersetTheme}>
        <Echart {...defaultProps} />
      </ThemeProvider>,
    );

    // Wait for initial render and setOption call
    await waitFor(() => {
      expect(mockSetOption).toHaveBeenCalled();
    });

    // Get the initial call args
    const firstCallArgs = mockSetOption.mock.calls[0];
    expect(firstCallArgs).toBeDefined();
    expect(firstCallArgs[1]).toBe(false); // notMerge should be false

    // Clear mock to test updates
    mockSetOption.mockClear();

    // Update with new data
    const newProps = {
      ...defaultProps,
      echartOptions: {
        series: [
          {
            data: [4, 5, 6],
          },
        ],
      },
    };

    rerender(
      <ThemeProvider theme={supersetTheme}>
        <Echart {...newProps} />
      </ThemeProvider>,
    );

    // Wait for update and verify setOption called with notMerge: false
    await waitFor(() => {
      expect(mockSetOption).toHaveBeenCalled();
    });

    const updateCallArgs = mockSetOption.mock.calls[0];
    expect(updateCallArgs).toBeDefined();
    expect(updateCallArgs[1]).toBe(false); // notMerge should be false for animations
  });

  test('should maintain chart instance across data updates', async () => {
    const { rerender } = render(
      <ThemeProvider theme={supersetTheme}>
        <Echart {...defaultProps} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(mockSetOption).toHaveBeenCalled();
    });

    const initialCallCount = mockDispose.mock.calls.length;

    // Update data multiple times
    for (let i = 0; i < 3; i++) {
      const newProps = {
        ...defaultProps,
        echartOptions: {
          series: [
            {
              data: [i, i + 1, i + 2],
            },
          ],
        },
      };

      rerender(
        <ThemeProvider theme={supersetTheme}>
          <Echart {...newProps} />
        </ThemeProvider>,
      );
    }

    // Chart instance should not be disposed during updates
    expect(mockDispose).toHaveBeenCalledTimes(initialCallCount);
  });

  test('should dispose chart on unmount', () => {
    const { unmount } = render(
      <ThemeProvider theme={supersetTheme}>
        <Echart {...defaultProps} />
      </ThemeProvider>,
    );

    unmount();

    expect(mockDispose).toHaveBeenCalled();
  });

  test('should call resize when dimensions change', async () => {
    const { rerender } = render(
      <ThemeProvider theme={supersetTheme}>
        <Echart {...defaultProps} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(mockSetOption).toHaveBeenCalled();
    });

    mockResize.mockClear();

    // Change dimensions
    rerender(
      <ThemeProvider theme={supersetTheme}>
        <Echart {...defaultProps} width={800} height={500} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(mockResize).toHaveBeenCalledWith({ width: 800, height: 500 });
    });
  });
});
