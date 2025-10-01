import React, { useState } from 'react';

interface TermsAndConditionsStepProps {
  onAcceptanceChange: (accepted: boolean) => void;
  isAccepted: boolean;
}

const TermsAndConditionsStep: React.FC<TermsAndConditionsStepProps> = ({
  onAcceptanceChange,
  isAccepted
}) => {
  const [showFullTerms, setShowFullTerms] = useState(false);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAcceptanceChange(e.target.checked);
  };

  return (
    <div style={{ textAlign: 'left', maxWidth: '100%' }}>
      {/* Combined Terms and Consent Box */}
      <div style={{
        padding: '20px',
        border: '3px solid #FF7043',
        backgroundColor: isAccepted ? '#B8D4C7' : '#F8F4E6',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '15px',
          color: '#FF7043',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Tachi Publisher License Agreement Summary
        </h3>
        
        <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#333' }}>
          <p style={{ marginBottom: '12px' }}>
            <strong>By minting this license NFT, you agree to:</strong>
          </p>
          
          <ul style={{ paddingLeft: '20px', marginBottom: '15px' }}>
            <li style={{ marginBottom: '8px' }}>
              Grant content licensing rights according to your selected usage permissions
            </li>
            <li style={{ marginBottom: '8px' }}>
              Allow Tachi to facilitate content protection and licensing transactions
            </li>
            <li style={{ marginBottom: '8px' }}>
              Comply with platform policies regarding content authenticity and ownership
            </li>
            <li style={{ marginBottom: '8px' }}>
              Accept responsibility for content you publish and license
            </li>
          </ul>

          <p style={{ marginBottom: '15px', fontSize: '12px', color: '#666' }}>
            <strong>Legal Notice:</strong> This NFT mint constitutes a legally binding agreement. 
            Ensure you have rights to the content and understand the licensing terms before proceeding.
          </p>
        </div>

        {/* Full Terms Toggle */}
        <button
          onClick={() => setShowFullTerms(!showFullTerms)}
          style={{
            background: 'none',
            border: 'none',
            color: '#FF7043',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            marginBottom: showFullTerms ? '15px' : '20px'
          }}
        >
          {showFullTerms ? 'Hide Full Terms' : 'View Full Terms & Privacy Policy'}
        </button>

        {/* Full Terms Expanded View */}
        {showFullTerms && (
          <div style={{
            padding: '15px',
            border: '2px solid #FF7043',
            backgroundColor: '#fff',
            marginBottom: '20px',
            maxHeight: '300px',
            overflowY: 'auto',
            fontSize: '12px',
            lineHeight: '1.5'
          }}>
            <h4 style={{ marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>
              Tachi Publisher License Agreement (Full Terms)
            </h4>
            
            <div style={{ color: '#555' }}>
              <p><strong>1. License Grant:</strong> By minting this NFT, you grant Tachi the right to facilitate licensing of your content according to the usage rights you specify. You retain ownership of your content.</p>
              
              <p><strong>2. Content Authenticity:</strong> You warrant that you own or have the necessary rights to license the content. You are responsible for ensuring content does not infringe on third-party rights.</p>
              
              <p><strong>3. Revenue Sharing:</strong> Tachi will collect licensing fees according to your pricing settings and distribute payments minus platform fees (typically 5-15%).</p>
              
              <p><strong>4. Content Protection:</strong> Tachi will use reasonable efforts to monitor and protect your content but cannot guarantee complete prevention of unauthorized use.</p>
              
              <p><strong>5. Platform Policies:</strong> You agree to comply with Tachi's community guidelines and content policies. Violations may result in license suspension.</p>
              
              <p><strong>6. Blockchain Records:</strong> This agreement is recorded on-chain. The NFT serves as proof of your acceptance of these terms.</p>
              
              <p><strong>7. Termination:</strong> You may discontinue licensing by transferring or burning the NFT. Existing licenses remain valid until expiration.</p>
              
              <p><strong>8. Limitation of Liability:</strong> Tachi's liability is limited to the platform fees collected. Use the platform at your own risk.</p>

              <p style={{ marginTop: '15px', marginBottom: '15px', fontStyle: 'italic' }}>
                <strong>Key Benefits:</strong> On-chain proof of ownership, automated licensing, 
                revenue sharing, and content protection through Tachi's network.
              </p>
              
              <p style={{ marginTop: '15px', fontStyle: 'italic' }}>
                For complete terms, privacy policy, and updates, visit: 
                <a href="#" style={{ color: '#FF7043', marginLeft: '5px' }}>
                  tachi.network/terms
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Consent Checkbox */}
        <div style={{
          padding: '15px',
          border: '2px solid #FF7043',
          backgroundColor: isAccepted ? '#52796F' : '#fff',
          textAlign: 'center'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            gap: '12px'
          }}>
            <input
              type="checkbox"
              checked={isAccepted}
              onChange={handleCheckboxChange}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer',
                accentColor: '#FF7043'
              }}
            />
            <span style={{ color: isAccepted ? '#fff' : '#333' }}>
              I have read, understood, and agree to the Tachi Publisher License Agreement
            </span>
          </label>
          
          <p style={{
            fontSize: '12px',
            color: isAccepted ? '#fff' : '#666',
            marginTop: '10px',
            fontStyle: 'italic'
          }}>
            This consent is required to proceed with NFT minting and creates a binding legal agreement.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsStep;