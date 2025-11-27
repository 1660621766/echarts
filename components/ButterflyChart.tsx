import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { ChartData } from '../types';

const data: ChartData[] = [
  { category: '唐山', heavyLoad: 72, overload: 41 },
  { category: '廊坊', heavyLoad: 41, overload: 52 },
  { category: '秦皇岛', heavyLoad: 52, overload: 20 },
  { category: '承德', heavyLoad: 39, overload: 15 },
  { category: '张家口', heavyLoad: 23, overload: 10 },
  { category: '超高压', heavyLoad: 41, overload: 34 },
];

export const ButterflyChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const categories = data.map((item) => item.category);
    // For the left side (Heavy Load), we make values negative to display them on the left of the 0 axis
    const heavyLoadData = data.map((item) => -item.heavyLoad);
    const overloadData = data.map((item) => item.overload);

    const blueColor = '#4E7CFF';
    const orangeColor = '#FCA555';

    const option: echarts.EChartsOption = {
      backgroundColor: '#fff',
      title: {
        text: '单位：台',
        textStyle: {
          color: '#666',
          fontSize: 14,
          fontWeight: 'normal',
        },
        left: 20,
        top: 10,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: any) => {
          let res = `${params[0].name}<br/>`;
          params.forEach((param: any) => {
            const value = Math.abs(param.value);
            const marker = `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span>`;
            res += `${marker} ${param.seriesName}: ${value}<br/>`;
          });
          return res;
        },
      },
      legend: {
        data: ['重载', '过载'],
        top: 10,
        icon: 'circle',
        itemGap: 30,
        textStyle: {
          color: '#666',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        min: -100,
        max: 100,
        interval: 20,
        splitLine: {
          show: true,
          lineStyle: {
            color: '#f0f0f0',
            type: 'dashed',
          },
        },
        axisLabel: {
          formatter: (value: number) => {
            return Math.abs(value).toString();
          },
          color: '#666',
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: 'category',
        data: categories,
        inverse: true, // To match the image order (Top to Bottom)
        axisTick: {
          show: false,
        },
        axisLine: {
          show: false, // Hide the vertical axis line
        },
        axisLabel: {
          margin: 20,
          color: '#666',
          fontSize: 14,
          fontWeight: 500,
        },
      },
      series: [
        {
          name: '重载',
          type: 'bar',
          stack: 'total',
          barWidth: 12,
          data: heavyLoadData,
          itemStyle: {
            color: blueColor,
            borderRadius: [5, 0, 0, 5], // Rounded corners on the left
          },
          label: {
            show: true,
            position: 'left',
            color: blueColor,
            fontWeight: 'bold',
            formatter: (params: any) => {
              return Math.abs(params.value).toString();
            },
          },
        },
        {
          name: '过载',
          type: 'bar',
          stack: 'total',
          barWidth: 12,
          data: overloadData,
          itemStyle: {
            color: orangeColor,
            borderRadius: [0, 5, 5, 0], // Rounded corners on the right
          },
          label: {
            show: true,
            position: 'right',
            color: orangeColor,
            fontWeight: 'bold',
            formatter: (params: any) => {
              return params.value.toString();
            },
          },
        },
      ],
    };

    chartInstance.current.setOption(option);

    // Responsive resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />;
};