"use client";

import { useEffect, useState } from "react";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Ranking = {
  rank: number;
  department: string;
  post_count: number;
  approved_count: number;
  total_points: number;
  total_roi: number;
};

type Trend = {
  date: string;
  total_roi: number;
};

export default function RankingPage() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [trend, setTrend] = useState<Trend[]>([]);

  useEffect(() => {
    fetch("https://tech0-gen-11-step3-2-py-62.azurewebsites.net/api/analytics/department-ranking")
      .then((res) => res.json())
      .then((data) => {
        setRankings(data.data || []);
      })
      .catch((err) => console.error("department-ranking error:", err));

    fetch("https://tech0-gen-11-step3-2-py-62.azurewebsites.net/api/analytics/roi-trend")
      .then((res) => res.json())
      .then((data) => {
        setTrend(data.data || []);
      })
      .catch((err) => console.error("roi-trend error:", err));
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">
        部門ランキング
      </h1>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-10">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          ROI推移
        </h2>

        <div style={{ width: "100%", height: "320px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value) =>
                  `¥${Number(value).toLocaleString()}`
                }
              />
              <Line
                type="monotone"
                dataKey="total_roi"
                stroke="#16a34a"
                strokeWidth={4}
                dot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6">
        {rankings.map((item) => (
          <div
            key={item.rank}
            className="bg-white rounded-2xl shadow-lg p-6 border-l-8 border-blue-500"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">
                  Rank #{item.rank}
                </p>

                <h2 className="text-2xl font-bold text-gray-900">
                  {item.department}
                </h2>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-500">
                  ROI
                </p>

                <p className="text-3xl font-bold text-green-600">
                  ¥{item.total_roi.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">
                  投稿数
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {item.post_count}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">
                  承認数
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {item.approved_count}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">
                  ポインチE
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {item.total_points}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
