// Copyright 2021-2022 The Memphis Authors
// Licensed under the Apache License, Version 2.0 (the “License”);
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// Changed License: [Apache License, Version 2.0 (https://www.apache.org/licenses/LICENSE-2.0), as published by the Apache Foundation.
//
// https://github.com/memphisdev/memphis-broker/blob/master/LICENSE
//
// Additional Use Grant: You may make use of the Licensed Work (i) only as part of your own product or service, provided it is not a message broker or a message queue product or service; and (ii) provided that you do not use, provide, distribute, or make available the Licensed Work as a Service.
// A "Service" is a commercial offering, product, hosted, or managed service, that allows third parties (other than your own employees and contractors acting on your behalf) to access and/or use the Licensed Work or a substantial set of the features or functionality of the Licensed Work to third parties as a software-as-a-service, platform-as-a-service, infrastructure-as-a-service or other similar services that compete with Licensor products or services.

import React, { useEffect, useState, useContext } from 'react';
import { Line } from 'react-chartjs-2';
import 'chartjs-plugin-streaming';
import './style.scss';
import moment from 'moment';
import { Context } from '../../../hooks/store';
import { convertBytes } from '../../../services/valueConvertor';
import SelectThroughput from '../../../components/selectThroughput';
import SegmentButton from '../../../components/segmentButton';

const yAxesOptions = [
    {
        gridLines: {
            display: true,
            borderDash: [3, 3]
        },
        ticks: {
            beginAtZero: true,
            callback: function (value) {
                return `${convertBytes(value, true)}/s`;
            },
            maxTicksLimit: 5
        }
    }
];

const ticksOptions = {
    stepSize: 1,
    maxTicksLimit: 10,
    minUnit: 'second',
    source: 'auto',
    autoSkip: true,
    callback: function (value, index) {
        return index % 2 === 0 ? moment(value, 'HH:mm:ss').format('hh:mm:ss') : '';
    }
};

const getDataset = (dsName, readWrite, hidden) => {
    return {
        label: `${readWrite} ${dsName}`,
        borderColor: '#6557FF',
        borderWidth: 1,
        backgroundColor: '#6557FF',
        fill: false,
        lineTension: 0.2,
        data: [],
        hidden: hidden
    };
};

function Throughput() {
    const [state, dispatch] = useContext(Context);
    const [throughputType, setThroughputType] = useState('write');
    const [selectedComponent, setSelectedComponent] = useState('total');
    const [selectOptions, setSelectOptions] = useState([]);
    const [data, setData] = useState({});

    const initiateDataState = () => {
        let dataSets = [];
        selectOptions.forEach((selectOption, i) => {
            dataSets.push(getDataset(selectOption.name, 'write', i !== 0));
            dataSets.push(getDataset(selectOption.name, 'read', true));
        });
        setData({ datasets: dataSets });
    };

    useEffect(() => {
        if (data?.datasets?.length === 0 && selectOptions.length > 0) initiateDataState();
    }, [selectOptions]);

    useEffect(() => {
        const foundItemIndex = selectOptions?.findIndex((item) => item.name === selectedComponent);
        if (foundItemIndex === -1) return;
        for (let i = 0; i < selectOptions?.length; i++) {
            if (i === foundItemIndex) {
                data.datasets[2 * i].hidden = throughputType === 'write' ? false : true;
                data.datasets[2 * i + 1].hidden = throughputType !== 'write' ? false : true;
            } else {
                data.datasets[2 * i].hidden = true;
                data.datasets[2 * i + 1].hidden = true;
            }
        }
    }, [throughputType, selectedComponent]);

    useEffect(() => {
        const components = state?.monitor_data?.brokers_throughput
            ?.map((element) => {
                return { name: element.name };
            })
            .sort(function (a, b) {
                if (a.name === 'total') return -1;
                if (b.name === 'total') return 1;
                let nameA = a.name.toUpperCase();
                let nameB = b.name.toUpperCase();
                if (nameA < nameB) {
                    return -1;
                }
                if (nameA > nameB) {
                    return 1;
                }
                return 0;
            });
        setSelectOptions(components);
    }, [state?.monitor_data?.brokers_throughput]);

    const getValue = (type, select) => {
        const foundItemIndex = state?.monitor_data?.brokers_throughput.findIndex((item) => item.name === select);
        return type === 'write' ? state?.monitor_data?.brokers_throughput[foundItemIndex].write : state?.monitor_data?.brokers_throughput[foundItemIndex].read;
    };

    const updateData = (chart) => {
        for (let i = 0; i < selectOptions?.length; i++) {
            chart.data?.datasets[2 * i]?.data?.push({
                x: moment(),
                y: getValue('write', selectOptions[i].name)
            });
            chart.data?.datasets[2 * i + 1]?.data?.push({
                x: moment(),
                y: getValue('read', selectOptions[i].name)
            });
        }
    };

    return (
        <div className="overview-components-wrapper throughput-overview-container">
            <div className="overview-components-header throughput-header">
                <div className="throughput-header-side">
                    <p>Live throughput</p>
                    <SegmentButton options={['write', 'read']} onChange={(e) => setThroughputType(e)} />
                </div>
                <SelectThroughput value={selectedComponent || 'total'} options={selectOptions} onChange={(e) => setSelectedComponent(e)} />
            </div>
            <div className="throughput-chart">
                <Line
                    height={'100%'}
                    data={data}
                    options={{
                        // responsive: true,

                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (tooltipItem, data) => {
                                    return tooltipItem?.value + ' test';
                                }
                            }
                        },

                        elements: { line: { tension: 0.5 }, point: { borderWidth: 1, radius: 1, backgroundColor: 'rgba(0,0,0,0)' } },
                        scales: {
                            xAxes: [
                                {
                                    type: 'realtime',
                                    distribution: 'linear',
                                    realtime: {
                                        refresh: 5000,
                                        onRefresh: function (chart) {
                                            if (data?.datasets?.length !== 0) {
                                                updateData(chart);
                                            }
                                        },
                                        delay: 1000,
                                        duration: 600000,
                                        time: {
                                            displayFormat: 'h:mm:ss'
                                        }
                                    },
                                    ticks: ticksOptions
                                }
                            ],
                            yAxes: yAxesOptions
                        }
                    }}
                />
            </div>
        </div>
    );
}

export default Throughput;
