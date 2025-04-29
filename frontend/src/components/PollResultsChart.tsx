import React from "react";
import { Pie } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface PollResultsChartProps {
    results: number[];
    options: { id: number; label: string }[];
}

const PollResultsChart: React.FC<PollResultsChartProps> = ({ options, results }) => {
    const data = {
        labels: options.map(option => option.label),
        datasets: [
            {
                label: "Votes",
                data: results,
                backgroundColor: [
                    "#FF6384",
                    "#36A2EB",
                    "#FFCE56",
                    "#4BC0C0",
                    "#9966FF",
                    "#FF9F40"
                ],
                borderWidth: 1
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: "bottom" as const
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        const label = context.label || "";
                        const value = context.parsed;
                        return `${label}: ${value} votes`;
                    }
                }
            }
        }
    };

    return (
        <>
            <style>
                {`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .chart-fade-in {
                    opacity: 0;
                    animation: fadeIn 0.8s ease-out forwards;
                }
                `}
            </style>

            <div style={{ width: "400px", maxWidth: "100%", margin: "0 auto" }} className="mt-5 chart-fade-in">
                <h4 className="text-center">Live Voting Results</h4>
                <Pie data={data} options={chartOptions} />
            </div>
        </>
    );
};

export default PollResultsChart;
