import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-100 py-6 mt-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold mb-2">出品方：</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            脉息 · MaiXi（PulseStream）由<strong>鹿溪联合创新实验室（LUXI Joint Innovation Lab）</strong>出品。标语：光映微澜，脉息自明。
                        </p>
                        <h3 className="font-semibold mb-2">数据隐私说明：</h3>
                        <p className="text-sm text-gray-600">
                            视频完全在您的本地设备上进行处理，绝不会上传到任何服务器。加载的视频以及捕获的视频帧在处理后会立即清除。
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">引用文献：</h3>
                        <p className="text-sm text-gray-600">
                            如果您在研究中使用了 MMRPhys 模型或此 Web 应用程序，请引用以下论文：<br />
                        </p>
                        <p className="text-sm text-gray-600">
                            [1] Jitesh Joshi and Youngjun Cho, "Efficient and Robust Multidimensional Attention in Remote Physiological Sensing through Target Signal Constrained Factorization", 2025. arXiv: 2505.07013 [cs.CV]<br />
                        </p>
                        <p className="text-sm text-gray-600">
                            [2] Jitesh Joshi, Youngjun Cho, and Sos Agaian, “FactorizePhys: Effective Spatial-Temporal Attention in Remote Photo-plethysmography through Factorization of Voxel Embeddings”, NeurIPS, 2024.<br />
                        </p>
                        <p className="text-sm text-gray-600">
                            [3] Jitesh Joshi and Youngjun Cho, “iBVP Dataset: RGB-thermal rPPG Dataset with High Resolution Signal Quality Labels”, MDPI Electronics, 13(7), 2024.<br />
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">源代码：</h3>
                        <p className="text-sm text-gray-600">
                            MMRPhys: <a href="https://github.com/PhysiologicAILab/MMRPhys" target="_blank" rel="noopener noreferrer">https://github.com/PhysiologicAILab/MMRPhys</a>.
                        </p>
                        <p className="text-sm text-gray-600">
                            MMRPhys Webapp: <a href="https://github.com/physiologicailab/mmrphys-live" target="_blank" rel="noopener noreferrer">https://github.com/physiologicailab/mmrphys-live</a>.
                        </p>

                    </div>
                    {/* <div>
                        <h3 className="font-semibold mb-2">Copyright:</h3>
                        <p className="text-sm text-gray-600">
                            Copyright (c) 2025 Computational Physiology and Intelligence Research at Department of Computer Science, University College London, 169 Euston Road, London, NW1 2AE, England, United Kingdom.
                        </p>
                    </div> */}
                </div>
            </div>
        </footer>
    );
};

export default Footer; 