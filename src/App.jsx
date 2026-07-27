import { useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { registerPlugin } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

const SmsPlugin = registerPlugin('SmsPlugin');

// 배터리 허용 팝업을 띄우기 전에, 무엇을 눌러야 하는지 먼저 알려 준다.
// 시스템 팝업에는 "배터리 최적화를 무시하시겠습니까?"라는 낯선 문구만 나와서
// 배터리가 닳을까 걱정해 [거부]를 누르기 쉽다. 실제로 그렇게 놓쳐서
// 감시가 멈추고 엉뚱한 안부 문자가 나간 적이 있다.
async function askBatteryExemption() {
  window.alert(
    '다음 창에서 [허용]을 눌러 주세요.\n\n' +
    '배터리를 더 쓰는 설정이 아닙니다.\n' +
    '휴대폰이 이 앱을 꺼버려서 위급할 때 문자가 가지 못하는 일을 막아 줍니다.'
  );
  await SmsPlugin.requestBatteryOptimization();
}

function IntroScreen() {
  return (
    <div className="screen" style={{ backgroundColor: 'var(--blue)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', position: 'relative' }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>❤️</h1>
      <h2 style={{ margin: 0, fontSize: '28px' }}>보디가드</h2>
      <div style={{ position: 'absolute', bottom: 'calc(20px + env(safe-area-inset-bottom))', fontSize: '14px', opacity: 0.8 }}>작은앱공방</div>
    </div>
  );
}

function SetupScreen({ onSave, initialSettings }) {
  // 기본값을 비워둔다. 예시 번호가 채워져 있으면 설정을 마친 것처럼 보여
  // 실제 위급 상황에 모르는 사람에게 문자가 갈 수 있다.
  const [name, setName] = useState(initialSettings?.name || '');
  const [phone, setPhone] = useState(initialSettings?.phone || '');
  const [phone2, setPhone2] = useState(initialSettings?.phone2 || '');
  const [batteryAlert, setBatteryAlert] = useState(initialSettings?.batteryAlert !== false);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) { setError('사용하는 분 호칭을 입력해 주세요.'); return; }
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length < 10) { setError('1순위 응급연락처를 정확히 입력해 주세요.'); return; }
    const digits2 = phone2.replace(/[^0-9]/g, '');
    if (phone2.trim() && digits2.length < 10) { setError('2순위 연락처 형식을 확인해 주세요.'); return; }
    setError('');
    onSave({ name: name.trim(), phone: phone.trim(), phone2: phone2.trim(), batteryAlert });
  };

  return (
    <div className="screen setup-screen" style={{ padding: 0 }}>
      <div className="setup-content" style={{ flex: 1, overflowY: 'auto', padding: '20px', paddingBottom: '40px' }}>
        <div className="setup-title">
          <span style={{ fontSize: '16px', color: 'var(--blue)' }}>초기 설정 (보호자용)</span><br />
          보디가드
        </div>

        <div className="input-group">
          <label>사용하는 분 호칭</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 어머니, 지민, 나" />
        </div>

        <div className="input-group">
          <label>1순위 응급연락처 (가족 등)</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div className="input-group">
          <label>2순위 보호자 연락처 (선택)</label>
          <input type="tel" value={phone2} onChange={(e) => setPhone2(e.target.value)} placeholder="추가 연락처가 있다면 입력" />
        </div>

        <div className="input-group">
          <label>자동 안부 확인 알람</label>
          <select disabled>
            <option>12시간 (기본 탑재)</option>
          </select>
          <small style={{display:'block', marginTop:'8px', color:'#666'}}>
            *화면이 12시간 동안 켜지지 않으면 보호자에게 문자가 자동 전송됩니다.
          </small>
        </div>

        <div className="input-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={batteryAlert}
              onChange={(e) => setBatteryAlert(e.target.checked)}
              style={{ width: '22px', height: '22px', cursor: 'pointer' }}
            />
            <span>배터리 부족 시 보호자에게 알림</span>
          </label>
          <small style={{display:'block', marginTop:'8px', color:'#666'}}>
            *배터리가 15% 이하로 떨어지면 보호자에게 문자를 보냅니다.
          </small>
        </div>

        <div style={{ padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px', marginTop: '15px', marginBottom: '15px', fontSize: '12px', color: '#555', lineHeight: '1.4' }}>
          <strong>개인정보 처리방침 및 권한 사용 동의</strong><br/>
          본 앱은 사용자의 안전을 위해 <strong>[위치 정보]</strong>와 <strong>[문자(SMS) 자동 발송]</strong> 권한을 사용합니다. 입력하신 연락처 및 위치 정보는 위급 상황 시 지정된 보호자에게 문자를 발송하는 용도로만 사용되며, 외부 서버에 수집되거나 저장되지 않습니다.<br/><br/>
          앱을 시작하시면 본 개인정보 처리방침 및 권한 사용에 동의하신 것으로 간주됩니다.
        </div>
      </div>

      <div className="setup-footer" style={{
        padding: '20px',
        backgroundColor: 'white',
        borderTop: '1px solid #eee',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
        paddingBottom: 'calc(20px + env(safe-area-inset-bottom))'
      }}>
        {error && (
          <div style={{ marginBottom: '12px', padding: '12px', background: '#FFECEC', border: '1px solid #FFB3B3', borderRadius: '10px', color: '#C0392B', fontSize: '14px', fontWeight: 700 }}>
            ⚠️ {error}
          </div>
        )}
        <button className="btn-primary" style={{ margin: 0, width: '100%' }} onClick={handleSave}>저장하고 권한 허용하기 →</button>
        <div style={{ textAlign: 'center', fontSize: '13px', color: '#888', marginTop: '12px' }}>
          <strong>작은앱공방</strong>
        </div>
      </div>
    </div>
  );
}

// 설치하는 보호자가 부모에게 넘기기 전에 모든 권한을 미리 받는 화면.
// 이렇게 해두면 나중에 부모가 위급 상황에서 버튼을 눌렀을 때
// 권한 팝업이 뜨는 일이 없다.
function PermissionScreen({ onDone }) {
  const [sms, setSms] = useState(false);
  const [loc, setLoc] = useState(false);
  const [batt, setBatt] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try { const r = await SmsPlugin.checkSmsPermission(); setSms(!!r.granted); } catch (e) { console.log(e); }
    try { const r = await Geolocation.checkPermissions(); setLoc(r.location === 'granted' || r.coarseLocation === 'granted'); } catch (e) { console.log(e); }
    try { const r = await SmsPlugin.checkBatteryOptimization(); setBatt(!!r.isIgnoring); } catch (e) { console.log(e); }
  };

  useEffect(() => { refresh(); }, []);

  // 배터리 최적화 제외는 별도 설정 화면을 열었다가 돌아오므로,
  // 앱이 다시 켜질 때(resume) 상태를 새로 확인한다.
  useEffect(() => {
    let handle;
    CapApp.addListener('appStateChange', ({ isActive }) => { if (isActive) refresh(); }).then(h => { handle = h; });
    return () => { if (handle) handle.remove(); };
  }, []);

  const requestAll = async () => {
    setBusy(true);
    try {
      if (!sms) { try { await SmsPlugin.requestSmsPermission(); } catch (e) { console.log(e); } }
      if (!loc) { try { await Geolocation.requestPermissions(); } catch (e) { console.log(e); } }
      await refresh();
      // 배터리는 마지막에. 설정 화면을 열면 앱이 백그라운드로 갔다가
      // 돌아올 때 위 resume 리스너가 상태를 갱신한다.
      const b = await SmsPlugin.checkBatteryOptimization();
      if (!b.isIgnoring) { try { await askBatteryExemption(); } catch (e) { console.log(e); } }
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const allGranted = sms && loc && batt;

  const handleDone = () => {
    if (allGranted) { onDone(); return; }
    const missing = [!sms && '문자', !loc && '위치', !batt && '앱이 꺼지지 않게 하기'].filter(Boolean).join(', ');
    // 배터리를 건너뛰면 감시가 멈출 뿐 아니라 '12시간 미사용' 안부 문자가
    // 엉뚱하게 나간다. 그 결과를 모른 채 넘어가지 않도록 분명히 알린다.
    const batteryWarn = !batt
      ? '\n\n특히 "앱이 꺼지지 않게 하기"를 건너뛰면, 휴대폰이 앱을 꺼버려서\n' +
        '· 위급할 때 문자가 가지 않고\n' +
        '· 반대로 잘 지내고 계신데도 "12시간 동안 사용되지 않았습니다" 문자가 잘못 갈 수 있습니다.\n' +
        '(배터리는 거의 쓰지 않으니 안심하고 허용하셔도 됩니다)'
      : '';
    if (window.confirm(`아직 허용되지 않은 항목이 있습니다: ${missing}${batteryWarn}\n\n그래도 이대로 시작할까요?`)) {
      onDone();
    }
  };

  const Row = ({ icon, title, desc, ok }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px', padding: '16px',
      background: ok ? '#E8F7EE' : '#fff', border: `1px solid ${ok ? '#7BC98F' : '#e2e2e2'}`,
      borderRadius: '12px', marginBottom: '12px'
    }}>
      <span style={{ fontSize: '26px', flex: 'none' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#222' }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.4, marginTop: '2px' }}>{desc}</div>
      </div>
      <span style={{ fontSize: '14px', fontWeight: 700, flex: 'none', color: ok ? '#2E9E52' : '#c0392b' }}>
        {ok ? '✅ 허용됨' : '● 필요'}
      </span>
    </div>
  );

  return (
    <div className="screen setup-screen" style={{ padding: 0 }}>
      <div className="setup-content" style={{ flex: 1, overflowY: 'auto', padding: '20px', paddingBottom: '40px' }}>
        <div className="setup-title">
          <span style={{ fontSize: '16px', color: 'var(--blue)' }}>권한 준비 (보호자용)</span><br />
          부모님께 드리기 전에
        </div>
        <div style={{ fontSize: '13px', color: '#555', lineHeight: 1.5, margin: '4px 0 20px' }}>
          아래 권한을 <strong>지금 보호자가 미리 허용</strong>해 주세요. 그래야 나중에 부모님이
          버튼을 눌렀을 때 <strong>권한 창이 뜨지 않고 곧바로</strong> 문자와 위치가 전송됩니다.
        </div>

        <Row icon="✉️" title="문자(SMS) 자동 발송" desc="위급 시 보호자에게 문자를 보냅니다." ok={sms} />
        <Row icon="📍" title="위치 정보" desc="지금 어디 있는지 지도 링크로 함께 보냅니다." ok={loc} />
        {/* "배터리 최적화 제외"라는 말은 배터리를 더 쓰겠다는 뜻으로 읽힌다.
            실제로는 반대인데, 그 오해 때문에 이 단계를 건너뛰면 감시가 멈추고
            엉뚱한 안부 문자까지 나간다. 그래서 제목·설명을 안심 위주로 쓴다. */}
        <Row
          icon="🔋"
          title="앱이 꺼지지 않게 하기"
          desc="배터리는 거의 쓰지 않습니다. 배터리를 더 쓰는 설정이 아니라, 휴대폰이 이 앱을 마음대로 꺼버리지 못하게 막아 주는 설정이에요."
          ok={batt}
        />
      </div>

      <div className="setup-footer" style={{
        padding: '20px', backgroundColor: 'white', borderTop: '1px solid #eee',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.05)', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))'
      }}>
        {!allGranted && (
          <button className="btn-primary" style={{ margin: 0, width: '100%' }} disabled={busy} onClick={requestAll}>
            {busy ? '허용 요청 중…' : '권한 허용하기'}
          </button>
        )}
        <button
          onClick={handleDone}
          style={{
            margin: allGranted ? 0 : '12px 0 0', width: '100%', padding: '15px',
            border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 700,
            color: allGranted ? 'white' : '#666',
            background: allGranted ? 'var(--blue, #2f6fdb)' : '#eee'
          }}
        >
          {allGranted ? '✅ 준비 완료 — 시작하기' : '건너뛰고 시작하기'}
        </button>
        <div style={{ textAlign: 'center', fontSize: '13px', color: '#888', marginTop: '12px' }}>
          <strong>작은앱공방</strong>
        </div>
      </div>
    </div>
  );
}

function MainScreen({ settings, onTrigger, onOpenSettings, isBatteryOptimized, onFixBattery }) {
  return (
    <div className="screen" style={{ position: 'relative' }}>
      <button
        onClick={onOpenSettings}
        style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '24px', opacity: 0.3, padding: '10px', cursor: 'pointer' }}
      >
        ⚙️
        {/* 설정을 마쳐야 한다는 표시. 어르신이 아니라 들여다보는 보호자를 위한 것이다. */}
        {isBatteryOptimized && (
          <span style={{
            position: 'absolute', top: '6px', right: '6px',
            width: '10px', height: '10px', borderRadius: '50%',
            backgroundColor: '#e53935'
          }} />
        )}
      </button>
      <div className="onboard-hello">
        <div className="hello-line">
          <span><span>{settings.name}</span> 님,</span>
          {/* 응급 버튼 위에 겹치면 위급할 때 버튼을 못 누른다.
              그래서 버튼 영역을 건드리지 않는 인사말 옆에 둔다. */}
          {isBatteryOptimized && (
            <button className="battery-pill" onClick={onFixBattery}>
              🔋 배터리 설정 필요
            </button>
          )}
        </div>
        무엇을 도와드릴까요?
      </div>

      <div className="grid-container">
        <button className="grid-btn btn-danger" onClick={() => onTrigger('🚑 보호자에게 응급 도움을 요청합니다.', true)}>
          <span className="emoji">🚨</span>
          <span className="label">아파요! 도움이 필요해요</span>
        </button>

        <button className="grid-btn btn-warning" onClick={() => onTrigger('🚕 보호자에게 택시를 불러달라고 요청합니다.', false)}>
          <span className="emoji">🚕</span>
          <span className="label">택시<br />필요해요</span>
        </button>

        <button className="grid-btn btn-purple" onClick={() => onTrigger('🧭 보호자에게 현재 내 위치를 보냅니다.', false)}>
          <span className="emoji">🧭</span>
          <span className="label">길을<br />잃었어요</span>
        </button>

        <button className="grid-btn btn-success" style={{ gridColumn: 'span 1' }} onClick={() => onTrigger('🏠 보호자에게 무사히 도착했다고 알립니다.', false)}>
          <span className="emoji">🏠</span>
          <span className="label">도착<br />했어요</span>
        </button>

        <button className="grid-btn btn-call" style={{ gridColumn: 'span 1' }} onClick={() => window.location.href = `tel:${settings.phone}`}>
          <span className="emoji">📞</span>
          <span className="label">전화<br />걸기</span>
        </button>
      </div>

      <div style={{ textAlign: 'center', fontSize: '13px', color: '#888', marginTop: '10px' }}>
        <strong>작은앱공방</strong>
      </div>
    </div>
  );
}

function CountdownScreen({ message, isEmergency, onCancel, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }
    const timerId = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    return () => clearTimeout(timerId);
  }, [timeLeft, onComplete]);

  const bgStyle = isEmergency ? { backgroundColor: 'var(--danger)' } : { backgroundColor: '#1c1c1e' };
  const textStyle = isEmergency ? { color: 'var(--danger)' } : { color: '#1c1c1e' };

  return (
    <div className="screen countdown-screen" style={bgStyle}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="action-text">{message}</div>
        <div style={{ fontSize: '20px', marginBottom: '40px', opacity: 0.9 }}>
          {isEmergency ? "응급 문자가 곧 발송됩니다" : "보호자에게 알림 문자가 전송됩니다"}
        </div>

        <div className="pulse-ring" style={textStyle}>{timeLeft}</div>
      </div>

      <button className="cancel-btn" onClick={onCancel}>❌ 실수로 눌렀어요 (취소)</button>
    </div>
  );
}

function ResultScreen({ success, isEmergency, onClose, onCall, onFalseAlarm }) {
  const [cancelState, setCancelState] = useState('idle'); // idle | sending | sent

  const handleFalseAlarm = async () => {
    setCancelState('sending');
    const ok = await onFalseAlarm();
    setCancelState(ok ? 'sent' : 'idle');
  };

  return (
    <div className="screen" style={{
      backgroundColor: success ? 'var(--success)' : 'var(--danger)',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      color: 'white', padding: '40px'
    }}>
      <div style={{ fontSize: '90px', marginBottom: '24px' }}>{success ? '✅' : '❌'}</div>
      <div style={{ fontSize: '30px', fontWeight: '900', marginBottom: '16px', textAlign: 'center' }}>
        {success ? '문자를 보냈어요!' : '전송 실패'}
      </div>
      {success ? (
        <>
          <div style={{ fontSize: '18px', marginBottom: isEmergency ? '24px' : '48px', textAlign: 'center', opacity: 0.9, lineHeight: 1.5 }}>
            보호자에게 문자가<br />전송되었습니다.
            {isEmergency && <><br /><span style={{ fontSize: '15px', opacity: 0.85 }}>위치도 확인되는 대로 함께 보냅니다.</span></>}
          </div>
          {isEmergency && (
            <button
              onClick={handleFalseAlarm}
              disabled={cancelState !== 'idle'}
              style={{
                backgroundColor: cancelState === 'sent' ? 'rgba(255,255,255,0.25)' : 'white',
                color: cancelState === 'sent' ? 'white' : 'var(--success)',
                border: 'none', borderRadius: '14px',
                padding: '18px', fontSize: '18px', fontWeight: '800',
                marginBottom: '16px', width: '100%',
                cursor: cancelState === 'idle' ? 'pointer' : 'default'
              }}>
              {cancelState === 'sent' ? '✅ 취소 문자를 보냈어요'
                : cancelState === 'sending' ? '보내는 중…'
                : '❌ 잘못 눌렀어요 (취소 문자 보내기)'}
            </button>
          )}
        </>
      ) : (
        <>
          <div style={{ fontSize: '18px', marginBottom: '32px', textAlign: 'center', opacity: 0.9, lineHeight: 1.5 }}>
            문자 전송에 실패했습니다.<br />직접 전화를 거세요.
          </div>
          <button onClick={onCall} style={{
            backgroundColor: 'white', color: 'var(--danger)',
            border: 'none', borderRadius: '14px',
            padding: '20px', fontSize: '22px', fontWeight: '900',
            marginBottom: '16px', width: '100%', cursor: 'pointer'
          }}>
            📞 지금 전화하기
          </button>
        </>
      )}
      <button onClick={onClose} style={{
        backgroundColor: 'rgba(255,255,255,0.2)', color: 'white',
        border: '2px solid white', borderRadius: '14px',
        padding: '16px', fontSize: '18px', fontWeight: '700',
        width: '100%', cursor: 'pointer'
      }}>
        확인
      </button>
    </div>
  );
}

function App() {
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('seniorCareSettings') ? 'main' : 'setup';
  });
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('seniorCareSettings');
    // 예시 이름·번호를 기본값으로 두면 설정 화면이 채워진 채로 열려
    // 그대로 저장될 수 있다. 위급 시 모르는 사람에게 문자가 간다. 반드시 비워 둔다.
    return saved ? JSON.parse(saved) : { name: '', phone: '', phone2: '', batteryAlert: true };
  });
  const [actionInfo, setActionInfo] = useState({ message: '', isEmergency: false });
  const [isBatteryOptimized, setIsBatteryOptimized] = useState(false);
  const [sendResult, setSendResult] = useState({ success: true, isEmergency: false });

  const checkBattery = async () => {
    try {
      const { isIgnoring } = await SmsPlugin.checkBatteryOptimization();
      setIsBatteryOptimized(!isIgnoring);
    } catch (e) {
      console.log('Battery check error:', e);
    }
  };

  useEffect(() => {
    if (currentView === 'main') {
      checkBattery();
      SmsPlugin.startMonitor({
        phone: settings.phone,
        phone2: settings.phone2 || '',
        name: settings.name,
        batteryAlert: settings.batteryAlert !== false
      }).catch(e => console.log('Monitor start error:', e));
    }
  }, [currentView, settings]);

  // 설정 화면(배터리 최적화 제외)에서 돌아왔을 때 상태를 다시 확인한다.
  // 예전엔 setTimeout(2초)으로 확인했는데, 백그라운드에서 타이머가 얼어붙고
  // 사용자가 설정을 바꾸기 전에 먼저 실행돼 옛 값을 읽었다. 그래서 설정을
  // 마쳐도 카드가 안 사라졌다. 앱 재개 이벤트는 백그라운드에서도 확실히
  // 발생하므로 이걸로 확인한다.
  useEffect(() => {
    let handle;
    CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) checkBattery();
    }).then(h => { handle = h; });
    return () => { if (handle) handle.remove(); };
  }, []);

  const handleRequestBatteryOptimization = async () => {
    // 허용 팝업을 띄운다. 실제 상태 갱신은 위 appStateChange(앱 재개) 리스너가 맡는다.
    try {
      await askBatteryExemption();
    } catch (e) {
      // 팝업도 설정 화면도 열리지 않는 기기가 있다. 아무 반응이 없으면
      // 보호자는 눌렀는지조차 알 수 없으므로 직접 찾아갈 길을 알려준다.
      console.log('배터리 설정 화면 열기 실패:', e);
      window.alert(
        '이 기기에서는 화면을 자동으로 열지 못했습니다.\n\n' +
        '휴대폰 설정 → 배터리 → 앱별 배터리 관리에서\n' +
        '"보디가드"를 찾아 "제한 없음"으로 바꿔 주세요.'
      );
    }
  };

  const handleSaveSetup = async (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('seniorCareSettings', JSON.stringify(newSettings));
    // 설정을 마치면 곧바로 main이 아니라 '권한 준비' 화면으로 보낸다.
    // 보호자가 여기서 문자·위치·배터리 권한을 미리 허용하고 부모에게 넘긴다.
    setCurrentView('permissions');
    try {
      await SmsPlugin.startMonitor({
        phone: newSettings.phone,
        phone2: newSettings.phone2 || '',
        name: newSettings.name,
        batteryAlert: newSettings.batteryAlert !== false
      });
    } catch (e) {
      console.log('Monitor start error:', e);
    }
  };

  const handleTrigger = async (message, isEmergency) => {
    if (isEmergency) {
      await executeAction(message, true);
    } else {
      setActionInfo({ message, isEmergency });
      setCurrentView('countdown');
    }
  };

  const handleCancelCountdown = () => {
    setCurrentView('main');
  };

  // 수신자 목록 (빈 값·중복 제거)
  const recipients = () => {
    const list = [settings.phone, settings.phone2]
      .map(p => (p || '').trim())
      .filter(p => p !== '');
    return [...new Set(list)];
  };

  // 수신자별로 개별 발송한다. 한 명에게 실패해도 나머지는 계속 보내고,
  // 하나라도 성공하면 성공으로 본다. (예전엔 2순위 실패 시 1순위 성공도 '실패'로 떴다)
  const sendToAll = async (message) => {
    let anySuccess = false;
    for (const phone of recipients()) {
      try {
        await SmsPlugin.sendSms({ phone, message });
        anySuccess = true;
      } catch (e) {
        console.error('문자 발송 실패:', phone, e);
      }
    }
    return anySuccess;
  };

  const getLocationText = async () => {
    try {
      const c = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true, timeout: 10000, maximumAge: 0
      });
      return `\n현재 위치: https://map.kakao.com/link/map/${c.coords.latitude},${c.coords.longitude}`;
    } catch (e) {
      return '\n(위치 확인 불가)';
    }
  };

  const executeAction = async (msg = actionInfo.message, isEmerg = actionInfo.isEmergency) => {
    if (isEmerg) {
      // 응급은 속도가 우선이므로 위치를 기다리지 않고 먼저 보낸다.
      const emergMsg = `🚨[긴급] ${settings.name} 님이 도움 요청 버튼을 눌렀습니다! 지금 바로 ${settings.name} 님에게 전화해 확인해 주세요!`;
      const ok = await sendToAll(emergMsg);
      setSendResult({ success: ok, isEmergency: true });
      setCurrentView('result');

      // 위치는 확보되는 대로 두 번째 문자로 보낸다.
      // (위급 상황일수록 '어디 있는지'가 가장 중요한 정보다)
      getLocationText().then(loc => {
        sendToAll(`🚨[긴급] ${settings.name} 님의 현재 위치입니다.${loc}`);
      });
      return;
    }

    const loc = await getLocationText();
    const ok = await sendToAll(`[알림] ${settings.name} 님: ${msg}${loc}`);
    setSendResult({ success: ok, isEmergency: false });
    setCurrentView('result');
  };

  // 오작동 취소 문자 (응급 발송 직후 결과 화면에서 사용)
  const sendFalseAlarm = async () => {
    return await sendToAll(`✅ ${settings.name} 님: 방금 알림은 실수로 눌린 것입니다. 괜찮으니 안심하세요.`);
  };

  return (
    <div className="app-container">
      {currentView === 'setup' && <SetupScreen onSave={handleSaveSetup} initialSettings={settings} />}
      {currentView === 'permissions' && <PermissionScreen onDone={() => setCurrentView('main')} />}
      {currentView === 'main' && (
        <MainScreen
          settings={settings}
          onTrigger={handleTrigger}
          onOpenSettings={() => setCurrentView('setup')}
          isBatteryOptimized={isBatteryOptimized}
          onFixBattery={handleRequestBatteryOptimization}
        />
      )}
      {currentView === 'countdown' && (
        <CountdownScreen
          message={actionInfo.message}
          isEmergency={actionInfo.isEmergency}
          onCancel={handleCancelCountdown}
          onComplete={() => executeAction()}
        />
      )}
      {currentView === 'result' && (
        <ResultScreen
          success={sendResult.success}
          isEmergency={sendResult.isEmergency}
          onClose={() => setCurrentView('main')}
          onCall={() => { window.location.href = `tel:${settings.phone}`; setCurrentView('main'); }}
          onFalseAlarm={sendFalseAlarm}
        />
      )}
    </div>
  );
}

export default App;
