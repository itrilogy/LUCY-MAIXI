import React, { useEffect } from 'react';
import { X, Info, FileText, Code2, Users, BookOpen } from 'lucide-react';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
    // Prevent scrolling on body when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            {/* Modal Container */}
            <div
                className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200/60"
                style={{ animation: 'slide-up 0.3s ease-out forwards' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-8 pb-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-950 rounded-2xl text-white shadow-lg shadow-slate-950/20">
                            <Info className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-950 tracking-tight leading-none">关于脉息 · MaiXi</h2>
                            <p className="text-xs font-black text-rose-600 uppercase tracking-widest mt-2 block">光映微澜，脉息自明</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 rounded-full hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-950"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Content Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10">

                    {/* Authorship */}
                    <section className="bg-rose-50/50 rounded-[2rem] p-6 border border-rose-100 flex items-start gap-4">
                        <Users className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest mb-1">出品方 / Producer</h3>
                            <p className="text-slate-700 font-medium">鹿溪联合创新实验室（LUXI Joint Innovation Lab）</p>
                        </div>
                    </section>

                    {/* Technical Principle Overview */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg"><FileText className="w-4 h-4 text-slate-600" /></div>
                            <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight italic">系统架构与技术 README</h3>
                        </div>
                        <div className="prose prose-slate prose-sm text-slate-600 font-medium leading-relaxed max-w-none">
                            <p>
                                <strong>脉息 · MaiXi（PulseStream，基于 MMRPhys-Live）</strong> 是一个基于视觉的远程生理感知 (rPPG) Web 平台，能够直接从普通网络摄像头视频流中无感提取心率 (Heart Rate) 和呼吸率 (Respiratory Rate)。
                            </p>
                            <ul className="space-y-1 mt-2 mb-4 list-disc pl-5">
                                <li><strong>默认协议：</strong>「标准健康监测」使用 SCAMPS 72×72、RGB/255 预处理、12 s 起算与 30 s FFT，与 mmrphys-live-base 对齐。</li>
                                <li><strong>场景按任务展示：</strong> TS-CAN / PhysFormer 只显示 BVP；BigSmall 显示 AU 真值；HRV 仅在抽出稳定 IBI 后计算。</li>
                                <li><strong>失败可见：</strong> 谱峰无效或 SNR 不足时显示 --，不再回退到 75 / 15 等假读数。</li>
                                <li><strong>本地推理：</strong> ONNX Runtime Web（WASM + SIMD），摄像头与视频文件均按 30 Hz 抽帧。</li>
                            </ul>
                        </div>
                    </section>

                    {/* Open Source References */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg"><Code2 className="w-4 h-4 text-slate-600" /></div>
                            <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight italic">开源基石文献 (Open Source)</h3>
                        </div>
                        <div className="space-y-3">
                            <p className="text-sm text-slate-600 mb-2 font-medium">本代码项目构架与训练模型基于以下卓越的开源项目：</p>
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                                <strong>MMRPhys-Live:</strong> <a href="https://github.com/PhysiologicAILab/mmrphys-live" className="text-rose-600 hover:underline" target="_blank" rel="noreferrer">https://github.com/PhysiologicAILab/mmrphys-live</a><br />
                                <strong>MMRPhys Model:</strong> <a href="https://github.com/PhysiologicAILab/MMRPhys" className="text-rose-600 hover:underline" target="_blank" rel="noreferrer">https://github.com/PhysiologicAILab/MMRPhys</a><br />
                                <strong>rPPG-Toolbox:</strong> <a href="https://github.com/ubicomplab/rPPG-Toolbox" className="text-rose-600 hover:underline" target="_blank" rel="noreferrer">https://github.com/ubicomplab/rPPG-Toolbox</a>
                            </div>
                        </div>
                    </section>

                    {/* Citations */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg"><BookOpen className="w-4 h-4 text-slate-600" /></div>
                            <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight italic">学术引文 (Citations)</h3>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="font-bold text-slate-800 mb-2 text-xs uppercase tracking-widest border-b border-slate-100 pb-2">MMRPhys Related</p>
                                <p className="text-slate-500 mb-2 italic">If you utilize the MMRPhys model or this web application in your research, please cite the following papers:</p>
                                <ul className="list-decimal pl-5 space-y-2 text-slate-700 font-medium">
                                    <li>Jitesh Joshi and Youngjun Cho, "Efficient and Robust Multidimensional Attention in Remote Physiological Sensing through Target Signal Constrained Factorization", 2025. arXiv: 2505.07013 [cs.CV]</li>
                                    <li>Jitesh Joshi, Youngjun Cho, and Sos Agaian, "FactorizePhys: Effective Spatial-Temporal Attention in Remote Photo-plethysmography through Factorization of Voxel Embeddings", NeurIPS, 2024.</li>
                                    <li>Jitesh Joshi and Youngjun Cho, "iBVP Dataset: RGB-thermal rPPG Dataset with High Resolution Signal Quality Labels", MDPI Electronics, 13(7), 2024.</li>
                                </ul>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="font-bold text-slate-800 mb-2 text-xs uppercase tracking-widest border-b border-slate-100 pb-2">rPPG-Toolbox Related</p>
                                <p className="text-slate-500 mb-2 italic">If you find our paper or this toolbox useful for your research, please cite our work.<br /><span className="text-xs">如果您发现我们的论文或此工具箱对您的研究有用，请引用我们的工作。</span></p>
                                <pre className="bg-slate-950 text-slate-300 p-4 rounded-xl overflow-x-auto text-[11px] leading-relaxed">
                                    {`@article{liu2022rppg,
  title={rPPG-Toolbox: Deep Remote PPG Toolbox},
  author={Liu, Xin and Narayanswamy, Girish and Paruchuri, Akshay and Zhang, Xiaoyu and Tang, Jiankai and Zhang, Yuzhe and Wang, Yuntao and Sengupta, Soumyadip and Patel, Shwetak and McDuff, Daniel},
  journal={arXiv preprint arXiv:2210.00716},
  year={2022}
}`}
                                </pre>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="btn-biopulse-primary w-full sm:w-auto"
                    >
                        朕知道了 / Got it
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AboutModal;
