use haste::broadcast::BroadcastHttp;

use super::constants::*;

pub async fn get_broadcast_url(
    client: &reqwest::Client, 
    match_id: u64
) -> Result<String, Box<dyn std::error::Error>> {
    let url = format!("{}/matches/{}/live/url", API_BASE_URL, match_id);
    
    let response_text = match client
        .get(&url)
        .header("User-Agent", USER_AGENT)
        .timeout(std::time::Duration::from_secs(REQUEST_TIMEOUT_SECS))
        .send()
        .await
    {
        Ok(response) => response.error_for_status()?.text().await?,
        Err(e) => {
            // Windows Schannel TLS issue - use PowerShell fallback
            println!("⚠️  reqwest failed ({}), using PowerShell fallback...", e);
            execute_powershell_request(&url)?
        }
    };
    
    let json: serde_json::Value = serde_json::from_str(&response_text)?;
    json.get("broadcast_url")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| "broadcast_url not found in API response".into())
}

#[cfg(target_os = "windows")]
fn execute_powershell_request(url: &str) -> Result<String, Box<dyn std::error::Error>> {
    crate::utils::windows::execute_web_request(url)
}

pub async fn try_connect_to_broadcast(
    client: reqwest::Client,
    broadcast_url: String,
    max_attempts: u32,
    delay_secs: u64,
) -> Result<BroadcastHttp<'static, reqwest::Client>, String> {
    for attempt in 1..=max_attempts {
        println!("📡 Attempt {}/{}: connecting to broadcast...", attempt, max_attempts);
        
        match BroadcastHttp::start_streaming(client.clone(), broadcast_url.clone()).await {
            Ok(stream) => {
                println!("✅ Connected!");
                return Ok(stream);
            }
            Err(e) => {
                if attempt < max_attempts {
                    println!("⚠️  Error: {}. Retrying in {} seconds...", e, delay_secs);
                    tokio::time::sleep(tokio::time::Duration::from_secs(delay_secs)).await;
                } else {
                    println!("❌ All retry attempts exhausted");
                    return Err(format!(
                        "Failed to connect after {} attempts: {}", 
                        max_attempts, 
                        e
                    ));
                }
            }
        }
    }
    
    Err("Maximum retry attempts exceeded".to_string())
}
