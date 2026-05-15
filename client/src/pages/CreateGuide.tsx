import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, Clock, MapPin, Type, DollarSign, Car } from 'lucide-react';

const CreateGuide: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    budget: '中',
    transportation: '',
    destinationName: '',
    destinationDescription: '',
    destinationRegion: '',
    destinationTags: '',
  });

  const [itinerary, setItinerary] = useState([
    {
      day: 1,
      title: '',
      description: '',
      activities: [{ time: '', text: '', location: '' }]
    }
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addDay = () => {
    setItinerary(prev => [
      ...prev,
      {
        day: prev.length + 1,
        title: '',
        description: '',
        activities: [{ time: '', text: '', location: '' }]
      }
    ]);
  };

  const removeDay = (index: number) => {
    if (itinerary.length === 1) return;
    const newItinerary = itinerary.filter((_, i) => i !== index).map((day, i) => ({
      ...day,
      day: i + 1
    }));
    setItinerary(newItinerary);
  };

  const handleDayChange = (index: number, field: string, value: string) => {
    const newItinerary = [...itinerary];
    newItinerary[index] = { ...newItinerary[index], [field]: value };
    setItinerary(newItinerary);
  };

  const addActivity = (dayIndex: number) => {
    const newItinerary = [...itinerary];
    newItinerary[dayIndex].activities.push({ time: '', text: '', location: '' });
    setItinerary(newItinerary);
  };

  const removeActivity = (dayIndex: number, activityIndex: number) => {
    const newItinerary = [...itinerary];
    newItinerary[dayIndex].activities = newItinerary[dayIndex].activities.filter((_, i) => i !== activityIndex);
    setItinerary(newItinerary);
  };

  const handleActivityChange = (dayIndex: number, activityIndex: number, field: string, value: string) => {
    const newItinerary = [...itinerary];
    newItinerary[dayIndex].activities[activityIndex] = { 
      ...newItinerary[dayIndex].activities[activityIndex], 
      [field]: value 
    };
    setItinerary(newItinerary);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      destinationTags: formData.destinationTags.split(',').map(t => t.trim()).filter(t => t),
      itinerary
    };

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/guides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const guide = await response.json();
        navigate(`/guide/${guide.id}`);
      } else {
        alert('建立失敗，請稍後再試。');
      }
    } catch (error) {
      console.error(error);
      alert('發生錯誤。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-guide-page">
      <div className="container">
        <button className="back-link" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> 返回
        </button>
        
        <header className="page-header">
          <h1>建立家族旅遊攻略</h1>
          <p>填寫您的行程細節，與家人分享完美的旅程。</p>
        </header>

        <form onSubmit={handleSubmit} className="guide-form">
          <section className="form-section">
            <h2 className="section-title"><Type size={20} /> 基本資訊</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>攻略標題</label>
                <input 
                  name="title" 
                  value={formData.title} 
                  onChange={handleInputChange} 
                  placeholder="例如：2026 北陸冬日家族之旅" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>作者名稱</label>
                <input 
                  name="author" 
                  value={formData.author} 
                  onChange={handleInputChange} 
                  placeholder="您的名字" 
                  required 
                />
              </div>
              <div className="form-group">
                <label><DollarSign size={16} /> 預算等級</label>
                <select name="budget" value={formData.budget} onChange={handleInputChange}>
                  <option value="低">低 (小資)</option>
                  <option value="中">中 (一般)</option>
                  <option value="高">高 (奢華)</option>
                  <option value="中高">中高</option>
                </select>
              </div>
              <div className="form-group">
                <label><Car size={16} /> 主要交通方式</label>
                <input 
                  name="transportation" 
                  value={formData.transportation} 
                  onChange={handleInputChange} 
                  placeholder="例如：JR 周遊券、租車" 
                  required 
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2 className="section-title"><MapPin size={20} /> 目的地資訊</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>目的地名稱</label>
                <input 
                  name="destinationName" 
                  value={formData.destinationName} 
                  onChange={handleInputChange} 
                  placeholder="例如：日本金澤、大阪" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>區域/國家</label>
                <input 
                  name="destinationRegion" 
                  value={formData.destinationRegion} 
                  onChange={handleInputChange} 
                  placeholder="例如：日本" 
                  required 
                />
              </div>
              <div className="form-group full-width">
                <label>簡短描述</label>
                <textarea 
                  name="destinationDescription" 
                  value={formData.destinationDescription} 
                  onChange={handleInputChange} 
                  placeholder="簡單介紹一下這個目的地..." 
                />
              </div>
              <div className="form-group full-width">
                <label>標籤 (以逗號分隔)</label>
                <input 
                  name="destinationTags" 
                  value={formData.destinationTags} 
                  onChange={handleInputChange} 
                  placeholder="例如：美食, 雪景, 溫泉" 
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="section-header-flex">
              <h2 className="section-title"><Clock size={20} /> 詳細行程規劃</h2>
              <button type="button" className="add-day-btn" onClick={addDay}>
                <Plus size={18} /> 新增一天
              </button>
            </div>

            <div className="itinerary-editor">
              {itinerary.map((day, dIdx) => (
                <div key={dIdx} className="day-editor-card">
                  <div className="day-editor-header">
                    <h3>第 {day.day} 天</h3>
                    <button type="button" className="remove-day" onClick={() => removeDay(dIdx)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="day-fields">
                    <input 
                      value={day.title} 
                      onChange={(e) => handleDayChange(dIdx, 'title', e.target.value)} 
                      placeholder="當日標題 (例如：抵達金澤)" 
                      className="day-title-input"
                    />
                    <textarea 
                      value={day.description} 
                      onChange={(e) => handleDayChange(dIdx, 'description', e.target.value)} 
                      placeholder="這一天主要在做什麼？" 
                    />
                  </div>

                  <div className="activities-editor">
                    <h4>行程項目</h4>
                    {day.activities.map((act, aIdx) => (
                      <div key={aIdx} className="activity-row">
                        <input 
                          value={act.time} 
                          onChange={(e) => handleActivityChange(dIdx, aIdx, 'time', e.target.value)} 
                          placeholder="時間 (12:00)" 
                          className="time-input"
                        />
                        <input 
                          value={act.text} 
                          onChange={(e) => handleActivityChange(dIdx, aIdx, 'text', e.target.value)} 
                          placeholder="活動內容" 
                          className="text-input"
                        />
                        <input 
                          value={act.location} 
                          onChange={(e) => handleActivityChange(dIdx, aIdx, 'location', e.target.value)} 
                          placeholder="地點" 
                          className="loc-input"
                        />
                        <button type="button" className="remove-act" onClick={() => removeActivity(dIdx, aIdx)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button type="button" className="add-act-btn" onClick={() => addActivity(dIdx)}>
                      <Plus size={16} /> 新增項目
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              <Save size={20} /> {loading ? '儲存中...' : '發佈攻略'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .create-guide-page {
          padding: 40px 0 100px;
          background: #f8fafc;
          min-height: 100vh;
        }
        .back-link {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: #64748b;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 24px;
        }
        .page-header {
          margin-bottom: 40px;
        }
        .page-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 8px;
        }
        .page-header p {
          color: #64748b;
          font-size: 1.1rem;
        }
        .form-section {
          background: white;
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          margin-bottom: 32px;
        }
        .section-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 24px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }
        .section-header-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .section-header-flex .section-title {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .full-width {
          grid-column: span 2;
        }
        label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        input, select, textarea {
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: var(--primary);
        }
        textarea {
          min-height: 100px;
          resize: vertical;
        }
        .add-day-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f1f5f9;
          color: #475569;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .add-day-btn:hover {
          background: #e2e8f0;
        }
        .day-editor-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .day-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .day-editor-header h3 {
          font-weight: 700;
          color: #334155;
        }
        .remove-day {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        .remove-day:hover {
          opacity: 1;
        }
        .day-fields {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        .day-title-input {
          font-weight: 600;
          font-size: 1.1rem;
        }
        .activities-editor h4 {
          font-size: 0.9rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .activity-row {
          display: grid;
          grid-template-columns: 100px 1fr 1fr 40px;
          gap: 12px;
          margin-bottom: 12px;
        }
        .remove-act {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .remove-act:hover {
          color: #ef4444;
        }
        .add-act-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: 1px dashed #cbd5e1;
          color: #64748b;
          padding: 8px 16px;
          border-radius: 8px;
          width: 100%;
          justify-content: center;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
        }
        .add-act-btn:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 40px;
        }
        .submit-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--primary);
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(59, 130, 246, 0.4);
        }
        .submit-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        @media (max-width: 768px) {
          .form-grid { grid-template-columns: 1fr; }
          .full-width { grid-column: auto; }
          .activity-row { grid-template-columns: 1fr 1fr; }
          .time-input { grid-column: span 2; }
          .remove-act { grid-row: 1; grid-column: 2; justify-self: end; }
        }
      `}</style>
    </div>
  );
};

export default CreateGuide;
