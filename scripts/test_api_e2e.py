import urllib.request, json, sys

base = 'http://127.0.0.1:8000/api/v1'

# 1. 注册
data = json.dumps({'email':'test3@clearmate.com','nickname':'测试用户3','password':'123456'}).encode()
req = urllib.request.Request(f'{base}/auth/register', data=data, headers={'Content-Type':'application/json'})
try:
    resp = urllib.request.urlopen(req)
    result = json.loads(resp.read().decode())
    token = result['access_token']
    print('1. 注册成功, token:', token[:20] + '...', flush=True)
except Exception as e:
    print('1. 注册失败, 尝试登录:', str(e)[:80], flush=True)
    data2 = json.dumps({'email':'test3@clearmate.com','password':'123456'}).encode()
    req2 = urllib.request.Request(f'{base}/auth/login', data=data2, headers={'Content-Type':'application/json'})
    resp2 = urllib.request.urlopen(req2)
    result = json.loads(resp2.read().decode())
    token = result['access_token']
    print('1. 登录成功, token:', token[:20] + '...', flush=True)

# 2. 创建任务
task_data = json.dumps({'title':'收到短信说中奖要我转账100元解冻费','task_type':'scam_check','description':'收到一条短信说我中了10万元大奖，要我先转账100元解冻费才能领奖'}).encode()
task_req = urllib.request.Request(f'{base}/tasks', data=task_data, headers={'Content-Type':'application/json','Authorization':f'Bearer {token}'})
task_resp = urllib.request.urlopen(task_req)
task = json.loads(task_resp.read().decode())
task_id = task['id']
print(f'2. 任务创建成功, id={task_id}', flush=True)

# 3. 触发分析
analysis_req = urllib.request.Request(f'{base}/tasks/{task_id}/analyses', data=b'{}', headers={'Content-Type':'application/json','Authorization':f'Bearer {token}'}, method='POST')
analysis_resp = urllib.request.urlopen(analysis_req)
analysis = json.loads(analysis_resp.read().decode())
print(f'3. 分析完成! risk_level={analysis["risk_level"]}, provider={analysis["provider"]}', flush=True)
rj = analysis['result_json']
print(f'   summary: {rj.get("summary","N/A")}', flush=True)
print(f'   risk_points: {rj.get("risk_points",[])}', flush=True)
print(f'   evidence_checklist: {rj.get("evidence_checklist",[])}', flush=True)
print(f'   counter_scripts: {rj.get("counter_scripts",[])}', flush=True)
print(f'   all_keys: {sorted(rj.keys())}', flush=True)
