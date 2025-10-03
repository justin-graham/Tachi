import * as React from "react";
import { useEffect, useState } from "react";
import Head from "next/head";

const ComputerGallery = () => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }

  return (
    <>
      
      <style jsx global>{`
        /* Gallery Styles */
        .container{
            padding: 0;
            margin: 0 auto;
            width: 100%;
            height: 100vh;
        }
        h1{
            position: relative;
            margin-bottom: 45px;
            font-family: 'Oswald', sans-serif;
            font-size: 44px;
            text-transform: uppercase;
            color: #424242;
        }
        .gallery-wrap {
            display: flex;
            flex-direction: row;
            width: 100%;
            height: 100vh;
        }
        .item {
            flex: 1;
            height: 100%;
            background-position: center;
            background-size: cover;
            background-repeat: none;
            transition: flex 0.8s ease;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #FAF9F6;
        }
        .item:hover{
            flex: 3;
        }
        .social{
            position: absolute;
            right: 35px;
            bottom: 0;
        }
        .social img{
            display: block;
            width: 32px;
        }

        /* Computer Screen Styles */
        :root {
            --mainblack: #22262b;
            --amain: #fbb053;
            --grisclaro: #e0e2e2;
            --display: #abadc6;
            --item: #d1c9bf;
            --codred: #ac5e47;
        }

        /* RESETS */
        .clearfix:before,
        .clearfix:after {
            content: "";
            display: table;
        } 
        .clearfix:after {
            clear: both;
        }

        .comp{
            width: 100%;
            height: 194px;
            text-align: center;
        }
        
        .computer-group {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transform: scale(0.8);
            transition: transform 0.8s ease;
        }
        
        .item:hover .computer-group {
            transform: scale(1.8);
        }
        
        .screen-label {
            font-family: 'Oswald', sans-serif;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #52796F;
            margin-bottom: 10px;
            z-index: 10;
        }
        
        .item:hover .screen-label {
            opacity: 1;
        }
        .item:hover .base {
            width: 338px;
            height: 12px;
        }
        .comp .monitor{
            width: 275px;
            height: 181px;
            display: block;
            margin: 0 auto;
            border-radius: 10px 10px 0px 0px;
            padding: 9px;
            border: solid 1px var(--grisclaro);
            background-color: black;
            position: relative;
            overflow: hidden;
        }
        .comp .mid{
            float: left;
            display: block;
            height: 100%;
            position: relative;
            background-color: var(--display);
            width: 100%;
        }
        .comp .site{
            overflow: hidden;
            position: absolute;
            width: 100%;
            height: 100%;
            bottom: 0;
            right: 0;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        }
        
        .item-1 .comp .site {
            background-image: url('/wallet-connect.png');
        }
        
        .item-2 .comp .site {
            background-image: url('/site-details.png');
        }
        
        .item-3 .comp .site {
            background-image: url('/pricing-config-updated.png');
        }
        
        .item-4 .comp .site {
            background-image: url('/license-creation.png');
        }
        
        .item-5 .comp .site {
            background-image: url('/gateway-deployment.png');
            background-color: #f0f0f0;
        }
        .comp .site .topbar{
            width: 100%;
        }
        .comp .site .cerrar{
            width: 100%;
            padding: 3px;
            line-height: 0;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            border-radius: 4px 4px 0px 0px;
            background-color: #afa895;
        }
        .comp .site .cerrar>div{
            display: inline-block;
            width: 2px;
            height: 2px;
            border-radius: 50%;
            background: white;
            margin: 0px 1px;
        }
        .comp .site .inhead{
            padding: 2px;
            height: 5px;
            background-color: #ddd8cf;
        }
        .comp .site .inhead .item{
            width: 10px;
            height: 1px;
            background-color: var(--item);
            margin: 0 1px;
            display: block;
            float: left;
        }
        .comp .txr{
            text-align: right;
        }
        .comp .txr .item{
            float: right;
        }
        .comp .inslid{
            width: 100%;
            height: 33px;
            background-color: #efebe2;
        }
        .comp .incont{
            padding-top: 10px;
            background: #fefaf0;
        }
        .comp .incont .item{
            background-color: var(--item);
            width: 53px;
            height: 2px;
            display: block;
            margin: 0 auto;
            margin-top: 1px;
        }
        .comp .incont .item:nth-child(1){
            width: 20px;
        }
        .comp .incont .item:nth-child(2){
            margin-top: 3px;
            width: 41px;
        }
        .comp .incont .item:nth-child(3){
            width: 32px;
        }
        .comp .incont .item:nth-child(4){
            width: 23px;
        }
        .comp .incont .wid{
            width: 100%;
            padding: 8px 1px;
        }
        .comp .incont .wid .itwid{
            width: 33.333%;
            float: left;
            height: 26px;
            padding: 0px 3px;
        }
        .comp .incont .wid .itwid>div{
            width: 100%;
            height: 100%;
            background-color: #f5f1e6;
            position: relative;
        }
        .comp .incont .wid .itwid>div .contfoot{
            position: absolute;
            bottom: 0;
            left: 0;
            height: 6px;
            width: 100%;
            background-color: #ebe5dc;
        }
        .comp .incont .infoot{
            background-color: #efebe2;
            height: 26px;
            width: 100%;
        }

        .base {
            width: 275px;
            height: 8px;
            background: var(--grisclaro);
            display: block;
            margin: 0 auto;
            border-radius: 0px 0px 6px 6px;
            transition: all 0.8s ease;
        }
        
        /* Mobile Styles */
        @media (max-width: 768px) {
          .computer-gallery-section {
            min-height: auto !important;
            height: auto !important;
            padding: 4rem 0 !important;
          }
          
          .container {
            height: auto !important;
            min-height: auto !important;
            padding: 0 1rem;
          }
          
          .gallery-wrap {
            flex-direction: column !important;
            height: auto !important;
            gap: 2rem;
          }
          
          .item {
            flex: none !important;
            height: 300px !important;
            width: 100% !important;
            max-width: 350px;
            margin: 0 auto;
            border-radius: 12px;
          }
          
          .item:hover {
            flex: none !important;
            transform: scale(1.02);
          }
          
          .computer-group {
            transform: scale(0.9) !important;
          }
          
          .item:hover .computer-group {
            transform: scale(1.0) !important;
          }
          
          .screen-label {
            font-size: 14px !important;
            margin-bottom: 15px !important;
          }
        }
        
        @media (max-width: 480px) {
          .computer-gallery-section {
            padding: 3rem 0 !important;
          }
          
          .container {
            padding: 0 1rem !important;
          }
          
          .gallery-wrap {
            gap: 1.5rem !important;
          }
          
          .item {
            height: 250px !important;
            max-width: 300px !important;
          }
          
          .computer-group {
            transform: scale(0.8) !important;
          }
          
          .item:hover .computer-group {
            transform: scale(0.9) !important;
          }
          
          .screen-label {
            font-size: 12px !important;
            margin-bottom: 12px !important;
          }
        }
      `}</style>
      
      <section style={{ backgroundColor: '#FAF9F6', width: '100%', minHeight: '100vh' }} className="computer-gallery-section">
        <div className="container">
            <div className="gallery-wrap">
                <div className="item item-1">
                    <div className="computer-group">
                        <div className="screen-label">1. Connect Wallet</div>
                        <div className="comp">
                            <div className="monitor">
                                <div className="mid">
                                    <div className="site"></div>
                                </div>
                            </div>
                            <div className="base"></div>
                        </div>
                    </div>
                </div>
                <div className="item item-2">
                    <div className="computer-group">
                        <div className="screen-label">2. Site Details</div>
                        <div className="comp">
                            <div className="monitor">
                                <div className="mid">
                                    <div className="site"></div>
                                </div>
                            </div>
                            <div className="base"></div>
                        </div>
                    </div>
                </div>
                <div className="item item-3">
                    <div className="computer-group">
                        <div className="screen-label">3. Pricing Config</div>
                        <div className="comp">
                            <div className="monitor">
                                <div className="mid">
                                    <div className="site"></div>
                                </div>
                            </div>
                            <div className="base"></div>
                        </div>
                    </div>
                </div>
                <div className="item item-4">
                    <div className="computer-group">
                        <div className="screen-label">4. License Creation</div>
                        <div className="comp">
                            <div className="monitor">
                                <div className="mid">
                                    <div className="site"></div>
                                </div>
                            </div>
                            <div className="base"></div>
                        </div>
                    </div>
                </div>
                <div className="item item-5">
                    <div className="computer-group">
                        <div className="screen-label">5. Gateway Deploy</div>
                        <div className="comp">
                            <div className="monitor">
                                <div className="mid">
                                    <div className="site"></div>
                                </div>
                            </div>
                            <div className="base"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>
    </>
  );
};

export default ComputerGallery;