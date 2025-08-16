#!/usr/bin/env python3
"""
Create a test trading chart image for upload testing.
This script generates a realistic-looking chart with trading data.
"""

import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import os

def create_test_trading_chart():
    """Create a realistic trading chart for testing purposes."""
    
    # Generate sample data
    np.random.seed(42)  # For reproducible results
    
    # Create date range
    start_date = datetime.now() - timedelta(days=30)
    dates = pd.date_range(start=start_date, periods=30, freq='D')
    
    # Generate realistic price data
    initial_price = 150.0
    prices = [initial_price]
    
    for _ in range(29):
        # Random walk with slight upward bias
        change = np.random.normal(0.5, 2.0)  # Mean 0.5, std 2.0
        new_price = max(prices[-1] + change, 1.0)  # Ensure price stays positive
        prices.append(new_price)
    
    # Create OHLC data
    data = []
    for i, (date, price) in enumerate(zip(dates, prices)):
        # Generate open, high, low based on close
        close = price
        open_price = close + np.random.normal(0, 0.5)
        high = max(open_price, close) + abs(np.random.normal(0, 1.0))
        low = min(open_price, close) - abs(np.random.normal(0, 1.0))
        volume = np.random.randint(100000, 1000000)
        
        data.append({
            'Date': date,
            'Open': open_price,
            'High': high,
            'Low': low,
            'Close': close,
            'Volume': volume
        })
    
    df = pd.DataFrame(data)
    
    # Create the chart
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8), 
                                   gridspec_kw={'height_ratios': [3, 1]})
    
    # Price chart
    ax1.plot(df['Date'], df['Close'], linewidth=2, color='#2E86C1', label='Close Price')
    ax1.fill_between(df['Date'], df['Low'], df['High'], alpha=0.2, color='#85C1E9')
    
    # Add moving averages
    df['MA5'] = df['Close'].rolling(window=5).mean()
    df['MA20'] = df['Close'].rolling(window=20).mean()
    
    ax1.plot(df['Date'], df['MA5'], linewidth=1, color='#E74C3C', label='5-Day MA', alpha=0.8)
    ax1.plot(df['Date'], df['MA20'], linewidth=1, color='#F39C12', label='20-Day MA', alpha=0.8)
    
    # Formatting
    ax1.set_title('AAPL - Apple Inc. Stock Chart (Test Data)', fontsize=16, fontweight='bold')
    ax1.set_ylabel('Price ($)', fontsize=12)
    ax1.grid(True, alpha=0.3)
    ax1.legend()
    
    # Format x-axis dates
    ax1.xaxis.set_major_formatter(mdates.DateFormatter('%m/%d'))
    ax1.xaxis.set_major_locator(mdates.DayLocator(interval=5))
    
    # Volume chart
    ax2.bar(df['Date'], df['Volume'], width=0.8, color='#58D68D', alpha=0.7)
    ax2.set_ylabel('Volume', fontsize=12)
    ax2.set_xlabel('Date', fontsize=12)
    ax2.grid(True, alpha=0.3)
    
    # Format x-axis for volume chart
    ax2.xaxis.set_major_formatter(mdates.DateFormatter('%m/%d'))
    ax2.xaxis.set_major_locator(mdates.DayLocator(interval=5))
    
    # Rotate x-axis labels
    plt.setp(ax1.xaxis.get_majorticklabels(), rotation=45)
    plt.setp(ax2.xaxis.get_majorticklabels(), rotation=45)
    
    # Add annotations
    ax1.annotate(f'Current: ${df["Close"].iloc[-1]:.2f}', 
                xy=(df['Date'].iloc[-1], df['Close'].iloc[-1]),
                xytext=(0.7, 0.9), textcoords='axes fraction',
                bbox=dict(boxstyle='round,pad=0.3', facecolor='yellow', alpha=0.7),
                fontsize=12, fontweight='bold')
    
    # Tight layout
    plt.tight_layout()
    
    # Save the chart
    output_path = 'test-trading-chart.png'
    plt.savefig(output_path, dpi=300, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.close()
    
    print(f"✅ Test trading chart created: {output_path}")
    print(f"📊 Chart contains 30 days of OHLC data with volume")
    print(f"📁 File size: {os.path.getsize(output_path)} bytes")
    
    return output_path

if __name__ == "__main__":
    create_test_trading_chart()
