pipeline {  
    agent any  
  
    environment {  
        SONAR_SERVER        = 'SonarQube'  
        SONAR_TOKEN         = credentials('sonarqube-token')  
  
        // Backend  
        BE_IMAGE            = 'parkontrol-backend'  
        BE_CONTAINER        = 'parkontrol-api'  
        BE_HOST_PORT        = '8000'  
        BE_APP_PORT         = '3000'  
  
        // Frontend  
        FE_IMAGE            = 'parkontrol-frontend'  
        FE_CONTAINER        = 'parkontrol-web'  
        FE_HOST_PORT        = '4200'  
    }  
  
    stages {  
  
        // ── 1. Install Dependencies (paralelo) ──────────────────  
        stage('Install Dependencies') {  
            parallel {  
                stage('Backend – Install') {  
                    steps {  
                        dir('backend') { sh 'npm ci' }  
                    }  
                }  
                stage('Frontend – Install') {  
                    steps {  
                        dir('frontend-angular') { sh 'npm ci' }  
                    }  
                }  
            }  
        }  
  
        // ── 2. Run Tests (paralelo) ──────────────────────────────  
        stage('Run Tests') {  
            parallel {  
                stage('Backend – Tests') {  
                    steps {  
                        dir('backend') { sh 'npm run test:cov' }  
                    }  
                }  
                stage('Frontend – Tests') {  
                    steps {  
                        dir('frontend-angular') {  
                            // ChromeHeadlessCI definido en karma.conf.js  
                            sh 'npx ng test --watch=false --browsers=ChromeHeadlessCI'  
                        }  
                    }  
                }  
            }  
        }  
  
        // ── 3. SonarQube Analysis (paralelo) ────────────────────  
        stage('SonarQube Analysis') {  
            parallel {  
                stage('Backend – Sonar') {  
                    steps {  
                        dir('backend') {  
                            withSonarQubeEnv("${SONAR_SERVER}") {  
                                sh "npx sonar-scanner -Dsonar.login=${SONAR_TOKEN}"  
                            }  
                        }  
                    }  
                }  
                stage('Frontend – Sonar') {  
                    steps {  
                        dir('frontend-angular') {  
                            withSonarQubeEnv("${SONAR_SERVER}") {  
                                sh "npx sonar-scanner -Dsonar.login=${SONAR_TOKEN}"  
                            }  
                        }  
                    }  
                }  
            }  
        }  
  
        // ── 4. Quality Gate ──────────────────────────────────────  
        // SonarQube envía un webhook por cada análisis; waitForQualityGate  
        // espera ambos resultados antes de continuar.  
        stage('Quality Gate') {  
            steps {  
                timeout(time: 5, unit: 'MINUTES') {  
                    waitForQualityGate abortPipeline: true  
                }  
            }  
        }  
  
        // ── 5. Docker Build (paralelo) ───────────────────────────  
        stage('Docker Build') {  
            parallel {  
                stage('Backend – Build Image') {  
                    steps {  
                        dir('backend') {  
                            sh "docker build -t ${BE_IMAGE}:${BUILD_NUMBER} -t ${BE_IMAGE}:latest ."  
                        }  
                    }  
                }  
                stage('Frontend – Build Image') {  
                    steps {  
                        dir('frontend-angular') {  
                            sh "docker build -t ${FE_IMAGE}:${BUILD_NUMBER} -t ${FE_IMAGE}:latest ."  
                        }  
                    }  
                }  
            }  
        }  
  
        // ── 6. Deploy (paralelo) ─────────────────────────────────  
        stage('Deploy') {  
            parallel {  
                stage('Backend – Deploy') {  
                    steps {  
                        sh """  
                            docker stop ${BE_CONTAINER} 2>/dev/null || true  
                            docker rm   ${BE_CONTAINER} 2>/dev/null || true  
                            docker run -d --name ${BE_CONTAINER} --network devops-net --restart always -p ${BE_HOST_PORT}:${BE_APP_PORT} -e PORT=${BE_APP_PORT} ${BE_IMAGE}:latest  
                        """  
                    }  
                }  
                stage('Frontend – Deploy') {  
                    steps {  
                        sh """  
                            docker stop ${FE_CONTAINER} 2>/dev/null || true  
                            docker rm   ${FE_CONTAINER} 2>/dev/null || true  
                            docker run -d --name ${FE_CONTAINER} --network devops-net --restart always -p ${FE_HOST_PORT}:80 ${FE_IMAGE}:latest  
                        """  
                    }  
                }  
            }  
        }  
    }  
  
    post {  
        success {  
            echo "API  -> http://localhost:${BE_HOST_PORT}/api"  
            echo "Web  -> http://localhost:${FE_HOST_PORT}"  
        }  
        failure {  
            echo "Pipeline fallido. Revisa los logs de la etapa que falló."  
        }  
        always {  
            sh 'docker image prune -f'  
        }  
    }  
}